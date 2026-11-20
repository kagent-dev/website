Port-forward the controller's API port in a separate terminal, and leave the command running.
```bash
kubectl port-forward -n kagent svc/kagent-controller 8083:8083
```
