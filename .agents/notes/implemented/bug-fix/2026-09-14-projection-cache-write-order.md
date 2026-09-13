# Agent Note: Preserve projection-cache checkpoint observation order

Status: implemented

English | [中文](2026-09-14-projection-cache-write-order.zh.md)

## Problem

Projection-cache writes capture detached state before awaiting Session-log durability. Session creation and `turn/end` can start writes for the same id close together. When those independent durability waits completed out of order, the storage domain received their puts in completion order, so an older creation checkpoint could overwrite the newer turn checkpoint. Platform I/O timing made the stored value nondeterministic even though the domain write chain itself remained serialized.

## Decision

`SessionProjectionCache` serializes the complete durability-and-put operation per `SessionId` from the point where `write()` observes the checkpoint. Each call captures rows and lifecycle identity synchronously, joins that id's write chain, flushes the log while the exact Session remains live, and then replaces the cache record. A later call waits for the earlier call to settle. The earlier caller still receives its own rejection, but that rejection does not prevent the later checkpoint from running. Reused ids share the same chain so a retiring lifecycle cannot land after its replacement.

Plugin teardown clears interval timers and drains these pre-domain write chains before closing the storage domain. The storage domain continues to own durability-before-memory ordering after a put enters it; the cache chain owns ordering across the preceding Session-log flush.

## Alternatives considered

**Rely on the storage-domain write chain.** Rejected because a cache put entered that chain only after its independent Session-log flush, which was the operation that could reverse the order.

**Wait for the creation checkpoint before allowing Session events.** Rejected because Session append is synchronous and must not block on cache I/O. Removing the creation checkpoint would lose seed-derived values for Sessions that receive no later event.

**Compare sequence numbers during record replacement.** Rejected because that requires read-modify-write merging across complete records and lifecycle identities. FIFO serialization per opaque Session id preserves the observed whole-record order directly.

## Consequences

Writes for different Session ids remain concurrent. A stalled durability flush delays later checkpoints for the same id, which preserves the existing requirement that the Session log lead its cache. Background failures remain fail-soft, and the next queued checkpoint can still heal a stale record.

## Verification

The write-policy regression test holds the creation durability flush open, observes a newer `turn/end` checkpoint, and proves that the newer flush waits and its value remains stored after both writes settle. The released-format fixtures continue to prove that compatible and invalid predecessor records are rewritten with the current projected title; the Windows CI job owns the platform timing signal that exposed the inversion.

## Related decisions

- [Session projection and command log](../../proposed/architecture/2026-07-27-session-projection-and-command-log.md)
- [Projection-cache cross-version read compatibility](../architecture/2026-09-02-projcache-cross-version-read-compat.md)
