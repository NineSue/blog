+++
title = "解决 VMware 缺失 vmci 内核模块问题"
description = "记录一次 VMware 缺失 vmci 内核模块导致虚拟机无法启动的排查与修复过程。"
date = 2025-12-13
draft = false
slug = "vmwarekm"

categories = ["linux"]
tags = ["VMware"]

toc = true
+++

## 背景
### 错误 & 环境版本
我想启动我部署好的虚拟机，但显示如下错误。
```bash
Unable to change virtual machine power state: Failed to open device "/dev/vmci": ?????????
Please make sure that the kernel module 'vmci' is loaded.
Module 'DevicePowerOn' power on failed.
Failed to start the virtual machine.
````

```bash
sa@SA:~$ vmware -v
[AppLoader] Use shipped Linux kernel AIO access library.
An up-to-date "libaio" or "libaio1" package from your system is preferred.
VMware Workstation 17.6.0 build-24238078

sa@SA:~$ lsb_release -a
No LSB modules are available.
Distributor ID:	Ubuntu
Description:	Ubuntu 24.04.3 LTS
Release:	24.04
Codename:	noble
```
---

## 问题分析 & 解决方案

这个错误表明缺少某个内核模块。。查找后发现是 `vmci`（Virtual Machine Communication Interface）缺少,既然少，那就添呗。

* `vmci` 是 VMware 的内核模块，用于 **宿主机和虚拟机之间的高速通信**。
* 它通过 `/dev/vmci` 提供接口，支持 VMware Tools、文件共享、剪贴板等功能。
* 没有它，虚拟机启动或者某些功能会失败。

经过查找和试验，在库 [vm-host-modules](https://github.com/bytium/vm-host-modules) 找到了适合的补丁。

---

### 安装

```bash
git clone https://github.com/bytium/vm-host-modules.git
cd vm-host-modules
git checkout 17.6

make
sudo make install
```

### 它会做什么？

* 安装编译后的模块 `vmmon.ko` 和 `vmnet.ko` 到 `/lib/modules/$(uname -r)/misc/`。
* 将生成的 `vmmon.tar` 和 `vmnet.tar` 文件复制到 `/usr/lib/vmware/modules/source/`。
* 运行

```bash
sudo vmware-modconfig --console --install-all
```

使用新模块更新 VMware。

---

## 后续说明

* 至此问题解决，虚拟机可以正常启动。
* 每次重启后模块更新会失效，需要手动加载。
* 自动加载可以使用定时任务或者 systemd 服务，这里我就没有深入研究了。
