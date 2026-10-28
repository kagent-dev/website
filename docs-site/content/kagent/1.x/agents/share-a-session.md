---
title: Share a session
description: Give another account access to one conversation with a share token, and bound its lifetime with a ttl the controller can cap.
weight: 60
author: kagent.dev
---

A share lets the owner of a {{< gloss "Session" >}}Session{{< /gloss >}} give another account access to that one conversation. Creating a share produces a token; a caller presenting that token reaches the shared Session without becoming its creator. kagent exposes three RPCs for this: `CreateSessionShare`, `ListSessionShares`, and `RevokeSessionShare`. There is no `kagent` CLI verb for sharing — it is a gRPC and UI procedure, not something you script from the command line.

## A share is a capability, not a grant to a user

The token resolves to the conversation's owner, and the backend answers as though the owner had asked, keeping the caller's own identity only for the record. Anyone holding the token acts with the owner's access to that one Session. The share does not name a person, and it does not create a second principal.

Each share carries one of two permissions:

| Permission | Allows |
| ---------- | ------ |
| `READ_ONLY` | A2A `get`, `list`, and `subscribe`. |
| `READ_WRITE` | The `READ_ONLY` operations, plus `send` and `cancel`. |

> [!WARNING]
> **`READ_ONLY` is not a security boundary in a default install.** `config.server.auth.mode` defaults to `insecure`, where a caller supplies its own identity in `X-User-Id`. A caller can claim the owner's identity and reach the Session without any share token at all. Treat `READ_ONLY` as a scope on what the share link can do, not as access control: the boundary holds only under `trusted-proxy`, with a credential-validating proxy in front of the controller. For the modes themselves, see [Controller authentication modes]({{< link path="about/substrate-runtime/identity#controller-authentication-modes" >}}).

## Bound the lifetime with `ttl`

When you create a share you can set `CreateSessionShareRequest.ttl` to a positive lifetime, counted from creation. The returned `SessionShare.expiresAt` records when the token stops granting access; once that time passes, the token lookup returns not found, and the owner still sees the expired share in `ListSessionShares` and can revoke it.

Omit `ttl` and `expiresAt` stays unset. The share then grants access until it is revoked or the Session is deleted.

An operator caps share lifetimes with `config.sessions.shareMaxTtl`:

```yaml
config:
  sessions:
    shareMaxTtl: 86400s
```

A positive cap rejects a `ttl` that exceeds it and supplies the lifetime for a request that omits `ttl`. The default `0s` leaves a share unbounded unless the client sets `ttl`, and a negative value is rejected at controller startup. Durations in the `config` block are protobuf seconds, so `86400s` rather than `24h`. For the idle-Session limit that separately governs the conversation itself, see [Expire idle Sessions]({{< link path="operations/operational-considerations#expire-idle-sessions" >}}).

## Spending and revoking a share

A caller spends the share by presenting the token in the `X-Share-Token` header. The controller resolves the token to the owner and scopes the call to that Session.

The owner revokes a share with `RevokeSessionShare`, keyed by the `SessionShare.id`. Revoking withdraws the holder's access immediately; the share record remains so the owner can confirm it is gone from `ListSessionShares`. Deleting the Session removes its shares with it.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Controller identity" subtitle="How authentication modes and shares scope who can reach a Session." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Idle Session expiry and the share lifetime cap." >}}
{{< /cards >}}
