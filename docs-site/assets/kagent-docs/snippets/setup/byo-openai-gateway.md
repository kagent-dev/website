To serve your own model, run a [vLLM](https://docs.vllm.ai/) server behind an OpenAI-compatible gateway, such as [Bifrost](https://github.com/maximhq/bifrost) or [LiteLLM](https://docs.litellm.ai/). Requests then travel from kagent to the gateway to vLLM.

Configure the gateway as an OpenAI-compatible provider in the same way, and get two further things right.
