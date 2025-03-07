import Link from "next/link";
import { Button } from "@/components/ui/button";
import QuickLink from "@/components/quick-link";

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-gray-400 mb-8">Learn how to use kagent to automate your Kubernetes operations with AI</p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" asChild>
            <Link href="/docs/getting-started/quickstart">Get Started</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <QuickLink title="Quick Start" description="Get up and running with kagent in your Kubernetes cluster in minutes." href="/docs/getting-started/quickstart" />
        <QuickLink title="Core Concepts" description="Learn about the fundamental concepts and architecture of kagent." href="/docs/introduction/what-is-kagent" />
        <QuickLink title="Examples" description="Examples to get you up and running with kagent." href="/docs/resources/examples" />
        <QuickLink title="FAQs" description="Frequently asked questions about kagent and its use cases." href="/docs/resources/faq" />
      </div>
    </div>
  );
}
