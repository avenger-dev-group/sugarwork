# Agent Note：保持投影缓存检查点的观察顺序

Status: implemented

[English](2026-09-14-projection-cache-write-order.md) | 中文

## Problem

投影缓存写入在等待 Session 日志持久化之前已捕获脱离引用的状态。会话创建与 `turn/end` 可以在很短时间内为同一 id 发起写入。这些独立的持久化等待乱序完成时，存储域会按完成顺序收到 put，使较旧的创建检查点可能覆盖更新的轮次检查点。即使存储域写入链本身依然串行，平台 I/O 时序仍会让最终存储值不确定。

## Decision

`SessionProjectionCache` 从 `write()` 观察到检查点的时刻起，按 `SessionId` 串行完整的“持久化后 put”操作。每次调用同步捕获行与生命周期身份，加入该 id 的写入链，在准确的 Session 仍处于活跃状态时刷新日志，然后替换缓存记录。较后调用等待较早调用结束。较早的调用方仍会收到自己的拒绝，但该拒绝不会阻止后续检查点执行。重用的 id 共享同一写入链，因此即将退役的生命周期不会在其替代者之后落盘。

插件关闭时先清除间隔计时器，再排空这些进入存储域之前的写入链，然后才关闭存储域。put 进入存储域后，仍由存储域保证先持久化、后更新内存；缓存写入链则负责对此前的 Session 日志刷新排序。

## Alternatives considered

**依赖存储域写入链。** 否决：缓存 put 只有在各自的 Session 日志刷新之后才进入该链，而正是这段操作会反转顺序。

**允许 Session 事件前等待创建检查点。** 否决：Session append 是同步操作，不应被缓存 I/O 阻塞。删除创建检查点则会丢失不再接收后续事件的 Session 中由种子派生的值。

**替换记录时比较序号。** 否决：这需要在完整记录与生命周期身份之间做读改写合并。按不透明 Session id 先进先出串行可直接保持所观察的整体记录顺序。

## Consequences

不同 Session id 的写入仍可并发。停滞的持久化刷新会延迟同一 id 的后续检查点，这保持了 Session 日志领先其缓存的现有要求。后台失败仍采用 fail-soft，下一个已排队的检查点仍可修复陈旧记录。

## Verification

写入策略回归测试持续阻塞创建时的持久化刷新，在此期间观察更新的 `turn/end` 检查点，并证明更新的刷新会等待，且两次写入都结束后仍保存新值。已发布格式的 fixture 继续证明兼容与无效的 predecessor record 会以当前投影标题重写；Windows CI job 拥有暴露此顺序反转的平台时序信号。

## Related decisions

- [Session 投影与命令日志](../../proposed/architecture/2026-07-27-session-projection-and-command-log.zh.md)
- [投影缓存跨版本读取兼容性](../architecture/2026-09-02-projcache-cross-version-read-compat.zh.md)
