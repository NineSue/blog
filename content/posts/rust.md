+++
title = "从底层看 Rust 的闭包、trait object 与 enum"
description = "从汇编和 C 对照理解 Rust 的闭包、胖指针和 tagged union。"
date = 2026-04-02
draft = false
slug = "rust"

categories = ["随笔"]
tags = ["Rust"]

toc = true
+++

## 一个视角
我遇到一个问题，Rust 的枚举类似于一个对象，可以包裹数据，那它到底是怎么做到的？
对比 C，其实就是 union（联合体）+ tag，也就是 **tagged union**，那不妨放到汇编里讲。

## 闭包
Rust 的闭包就是 C 的结构体 + 函数，通过 Godbolt 可以知道：

```rust
#[inline(never)]                                                              
  pub fn closure_test(x: i32, y: i32, z: i32) -> i32 {
      let add = |z: i32| x + y + z;
      add(z)
  }

```
```asm
example::closure_test::hebcfab17509b2e82:
        lea     eax, [rdi + rsi]
        add     eax, edx
        ret
```

```c
struct Closure {
      int x;
      int y;
  };

  int call(struct Closure* self, int z) {
      return self->x + self->y + z;
  }

  int closure_test() {
      struct Closure c = {10, 20};
      return call(&c, 5);
  }

```
```asm
call:
        mov     eax, DWORD PTR [rdi]
        add     eax, DWORD PTR [rdi+4]
        add     eax, esi
        ret
closure_test:
        mov     eax, 35
        ret
```

### 结果

![Rust 闭包到底层结构的示意图](/img/posts/rust/rust-closure-structure.png)
经过以上例子可以发现，的确如此，但是 Rust 编译器对汇编做了优化，用了更高效的指令重组。`lea` 本是为算地址设计的（`base + index*scale + disp`），LLVM 把它当算术合并器在用：一条指令完成 `x + y`，且不发起内存访问，也不占 load 端口。比起「`mov` 读内存 + `add`」的常规序列，省指令也省访存周期。这里也可以体现出来 Rust 的零成本抽象——闭包在源码层是「捕获环境的对象」，到汇编层连结构体的影子都没了。

## 多态

Rust 的多态也很有意思。对比 C++：对象内存里塞一个 `vptr`（虚表指针），指向类共享的 vtable，多态成本摊在**每个对象**上。Rust 反过来——对象本身保持干净，只在需要多态时把引用变成 16 字节的胖指针（`data ptr + vtable ptr`），成本摊在**指针**上。

```
  &dyn Animal（胖指针）：

  ┌──────────────┐
  │ data 指针     │  8 字节 → 指向 Dog 数据
  ├──────────────┤
  │ vtable 指针   │  8 字节 → 指向函数表
  └──────────────┘

  Dog 对象本身不变：
  ┌──────────────┐
  │ name         │  还是只有数据
  │ age          │  没被塞入任何东西
  └──────────────┘

```

如果只从“底层长什么样”来做一个很粗暴但好记的对照，我觉得可以这样记：

```
Rust 闭包
  = 捕获环境的匿名结构体 + 编译器生成的调用逻辑
  = “数据和行为绑定在一起”，但能被内联优化到几乎看不见

Rust trait object
  = data pointer + vtable pointer
  = 胖指针负责多态分发，对象本体依然只放自己的数据

Rust enum
  = discriminant(tag) + payload
  = 概念上非常接近 C 里的 tagged union
```

所以这三者虽然都看起来“高层抽象”，但底下解决的问题其实不一样：

```
闭包：解决“把环境一起打包成可调用对象”
trait object：解决“运行时动态分发”
enum：解决“一个值在多个变体之间切换”
```


## 模仿 enum

```rust
enum Message {
    Quit,                       // 无数据
    Move { x: i32, y: i32 },    // 带结构体
    ChangeColor(i32, i32, i32), // 带三个整数
}

  #[inline(never)]                                                              
  pub fn handle(msg: &Message) -> i32 {
      match msg {
          Message::Quit => 0,
          Message::Move { x, y } => x + y,
          Message::ChangeColor(r, g, b) => r + g + b,
      }
  }

```

```asm
example::handle::h1107a4acf31d74e6:
        mov     eax, dword ptr [rdi]
        test    eax, eax
        je      .LBB0_4
        cmp     eax, 1
        jne     .LBB0_3
        mov     eax, dword ptr [rdi + 8]
        add     eax, dword ptr [rdi + 4]
        ret
.LBB0_3:
        mov     eax, dword ptr [rdi + 8]
        add     eax, dword ptr [rdi + 4]
        add     eax, dword ptr [rdi + 12]
.LBB0_4:
        ret
```
```c
struct Message {
      int tag;    // 0 = Quit, 1 = Move, 2 = ChangeColor
      union {
          struct { int x; int y; } move;
          struct { int r; int g; int b; } color;
      };
  };

  __attribute__((noinline))
  int handle(struct Message* msg) {
      switch (msg->tag) {
          case 0: return 0;
          case 1: return msg->move.x + msg->move.y;
          case 2: return msg->color.r + msg->color.g + msg->color.b;
      }
      return -1;
  }

```

```
handle:
        mov     eax, DWORD PTR [rdi]
        cmp     eax, 1
        je      .L2
        cmp     eax, 2
        je      .L3
        neg     eax
        sbb     eax, eax
        ret
.L2:
        mov     eax, DWORD PTR [rdi+8]
        add     eax, DWORD PTR [rdi+4]
        ret
.L3:
        mov     eax, DWORD PTR [rdi+8]
        add     eax, DWORD PTR [rdi+4]
        add     eax, DWORD PTR [rdi+12]
        ret
```
可以发现基本一致，就是可以理解为 **Rust enum = C tagged union**。

> 注意：Rust enum 的具体内存布局默认是**未指定的**，这里只是当前 rustc 的一种实现，未来版本可能因 niche optimization 等做出调整。要稳定布局需要 `#[repr(C)]` / `#[repr(u8)]` 等显式标注。

![Rust enum 到 tagged union 的示意图](/img/posts/rust/rust-enum-layout.png)
