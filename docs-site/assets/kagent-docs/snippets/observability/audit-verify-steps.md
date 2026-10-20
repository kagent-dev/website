1. Send a request to the new Session.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent my-first-agent -o json | jq -r '.session.id')
   kagent agent invoke --session $SESSION_ID --task "Audit check: what is 2+2?"
   ```

2. Find the captured request in your tracing backend.
   {{< tabs >}}
   {{% tab name="Grafana with Tempo" %}}
   1. Forward the Grafana port, and leave the command running.
      ```bash
      kubectl port-forward -n telemetry svc/kube-prometheus-stack-grafana 3000:80
      ```
   2. In your browser, open Grafana at [http://localhost:3000](http://localhost:3000), and log in. {{< reuse "kagent-docs/snippets/observability/grafana-password.md" >}}
   3. Open **Explore**, select the **Tempo** data source, and select the **TraceQL** query type.
   4. Run the following query, which returns the model calls whose request contains the phrase.
      ```text
      { span.gen_ai.input.messages =~ ".*Audit check.*" }
      ```
   5. Open a trace, and select its `generate_content` span. The **Span Attributes** section shows the three attributes described in [What a record holds](#what-a-record-holds).
   {{% /tab %}}
   {{% tab name="Jaeger" %}}
   1. Forward the Jaeger query port, and leave the command running.
      ```bash
      kubectl port-forward -n telemetry svc/jaeger 16686:16686
      ```
   2. In your browser, open Jaeger at [http://localhost:16686](http://localhost:16686).
   3. From the **Service** list, select `my-first-agent`. From the **Operation** list, select the `generate_content` operation for your model, such as `generate_content gpt-4.1-mini`, and click **Find Traces**.
   4. Open the most recent trace, and expand the `generate_content` span. The **Tags** section shows the three attributes described in [What a record holds](#what-a-record-holds).
   {{% /tab %}}
   {{< /tabs >}}

   If `gen_ai.input.messages` and `gen_ai.output.messages` read `{}`, the Session started without content capture. Check that the previous section printed `Current`, and create a new Session if it did not.

3. To collect every model call of one conversation, search by its conversation ID. Every span of the conversation carries the ID in the `gen_ai.conversation.id` attribute. For the other attributes that you can search by, see [Correlation attributes]({{< link path="observability/tracing#correlation-attributes" >}}).
