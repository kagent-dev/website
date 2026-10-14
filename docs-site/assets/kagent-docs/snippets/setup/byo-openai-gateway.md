To serve your own model, run a [vLLM](https://docs.vllm.ai/) server behind an OpenAI-compatible gateway, such as [Bifrost](https://github.com/maximhq/bifrost) or [LiteLLM](https://docs.litellm.ai/). Requests then travel from kagent through the gateway to vLLM, and you configure the gateway as the provider endpoint.

Launch vLLM with automatic tool choice, and set `model` to the identifier that the gateway routes on.
