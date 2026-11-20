Prepare authentication for your client. If your installation requires authentication, get an access token for your user and export it in the shell where you run the client commands.
```bash
export TOKEN="<access-token>"
```

If your installation does not require authentication, leave `TOKEN` unset. For the available authentication modes, see [Controller authentication modes]({{< link path="about/substrate-runtime/identity#controller-authentication-modes" >}}).
