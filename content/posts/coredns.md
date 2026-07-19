+++
title = "CoreDNS 是怎么知道映射的"
description = "k8s 里域名怎么解析？从 Pod 的「我是谁/我找谁」到 CoreDNS 的「我问自己」。"
date = 2026-05-25
draft = false
slug = "coredns"

categories = ["随笔"]
tags = ["云原生"]

toc = true
+++

## CoreDNS

首先 DNS 解决的问题不必多说，就是**域名和 IP 的映射**。在单机宿主机我们可以采用配置 `/etc/hosts` 的方式来改变映射。而在 k8s 集群的环境下，他们又是如何解决的呢。

k8s 设计了一种组件叫 **CoreDNS**，字面意思**核心域名解析系统**，旨在为资源对象解决域名映射的问题。

---

### 资源对象视角

Pod 是 k8s **调度的最小单位**。Pod 创建时，**CNI 插件**为其分配 IP，**kubelet** 拿到后通过状态更新上报 API Server，再写入 etcd。etcd 可以简单理解为一个 hashmap 存储 kv，这里解决了「**我是谁**」的问题。

Pod 的隔离由 **Linux namespace** 提供（mount namespace 管文件系统视图、network namespace 管网络栈、PID namespace 管进程视图等），**cgroup** 负责的是**资源限额**（CPU、内存），二者分工不同。kubelet 在创建 Pod 时根据 `dnsPolicy`（默认 `ClusterFirst`）写入 `/etc/resolv.conf`，nameserver 通常指向 **kube-dns 这个 Service 的 ClusterIP**（默认 `10.96.0.10`），流量再经 kube-proxy 转发到后端 CoreDNS Pod。这里解决了「**我找谁**」的问题。

### CoreDNS 视角

当有人来拍肩问路，我们直接告诉他就 ok。但我们怎么能知道类似于 `/etc/hosts` 的映射明细呢？这个组件的设计不能是静态的硬编码，需要是**动态的、灵活的**。

k8s 采用了「**我问自己**」的设计。CoreDNS 通过 **List-Watch** 机制与 API Server 交互：启动时 **List** 拉取一次全量映射，随后维持一条 **Watch** 长连接订阅增量事件。当 Service 新增、删除或后端 Pod 就绪状态变化时，API Server 通过这条连接推送事件，CoreDNS 增量刷新内存中的映射，无需重启或轮询。至此**动态 DNS** 达成。

需要注意，CoreDNS 解析的对象主要是 **Service**，而不是普通 Pod（**Headless Service** 的后端 Pod 例外，或显式声明了 `hostname/subdomain` 的 Pod）。

如果问了 CoreDNS 不认识的域名，例如 `ninesue.online`，CoreDNS 就会去问其他人，也就是**上级 DNS**。

---

### 谈谈别的

在看 Pod 的时候瞥见两个名词，**Service** 和 **EndpointSlice**，出于好奇，把理解记录在这篇。

**Service** 是一个稳定的**虚拟访问入口**（ClusterIP + Port + 选择规则），作用是**屏蔽后端 Pod 的动态变化**——Pod 会挂会重建，IP 也会变，但 Service 的 ClusterIP 保持稳定。**EndpointSlice** 则维护 Service 选中的后端 Pod 列表（IP、Port、就绪状态），**分片存储**是为了大规模集群下的性能。

两者关系：**Service 定义「访问什么」，EndpointSlice 维护「实际转发到哪些 Pod」**。

os 和 network 还是太有意思了（小声），但终究是理论还需实践。
