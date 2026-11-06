---
title: Session sharing
description: Give another account access to one conversation with a share token, and bound its lifetime with a ttl the controller can cap.
weight: 60
author: kagent.dev
---

A share lets the owner of a {{< gloss "Session" >}}Session{{< /gloss >}} give another account access to that one conversation. Creating a share produces a token; a caller presenting that token reaches the shared Session without becoming its creator. kagent exposes three RPCs for this: `CreateSessionShare`, `ListSessionShares`, and `RevokeSessionShare`. There is no `kagent` CLI verb for sharing. Sharing is a gRPC and UI procedure, not something you script from the command line.

## A share is a capability, not a grant to a user

Every share is read-only. The holder can A2A `get`, `list`, and `subscribe` on the shared Session. The holder cannot send a message, cancel a task, or create a Session.

The share does not act with the owner's access. When a caller presents a share token, the controller checks the caller's own identity against policy and uses the share only to locate the record's owner in storage. Checking the owner instead would lend the owner's grants to visitors. A holder needs their own read permission on the Session for a share to be useful: the share supplies the lookup, the holder's own credentials supply the authority. The share does not name a person, and it does not create a second principal.

> [!WARNING]
> **`insecure` mode is not a security boundary in a default install.** `config.server.auth.mode` defaults to `insecure`, where a caller supplies its own identity in `X-User-Id` and the authorizer it installs permits every check. A caller can claim any identity and reach the Session without any share token at all. The boundary holds only under `trusted-proxy`, with a credential-validating proxy in front of the controller. For the modes themselves, see [Controller authentication modes]({{< link path="about/substrate-runtime/identity#controller-authentication-modes" >}}).

## Bound the lifetime with `ttl`

When you create a share you can set `CreateSessionShareRequest.ttl` to a positive lifetime, counted from creation. The returned `SessionShare.expiresAt` records when the token stops granting access; once that time passes, the token lookup returns not found, and the owner still sees the expired share in `ListSessionShares` and can revoke it.

An operator caps share lifetimes with `config.sessions.shareMaxTtl`:

```yaml
config:
  sessions:
    shareMaxTtl: 86400s
```

A positive cap rejects a `ttl` that exceeds it and supplies the lifetime for a request that omits `ttl`. When no cap is set, an omitted `ttl` leaves `expiresAt` unset, and the share then grants access until it is revoked or the Session is deleted. The default `0s` leaves a share unbounded unless the client sets `ttl`, and a negative value is rejected at controller startup. Durations in the `config` block are protobuf seconds, so `86400s` rather than `24h`. For the idle-Session limit that separately governs the conversation itself, see [Expire idle Sessions]({{< link path="operations/operational-considerations#expire-idle-sessions" >}}).

## Spending and revoking a share

A caller spends the share by presenting the token in the `X-Share-Token` header. The controller resolves the token to the Session's owner and scopes the call to that Session.

The owner revokes a share with `RevokeSessionShare`, keyed by the `SessionShare.id`. Revoking deletes the share: the record does not remain, and it no longer appears in `ListSessionShares`. Deleting the Session removes its shares with it.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Controller identity" subtitle="How authentication modes and shares scope who can reach a Session." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Idle Session expiry and the share lifetime cap." >}}
{{< /cards >}}
