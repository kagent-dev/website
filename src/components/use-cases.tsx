import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

const useCases = [
  {
    title: "Connection Issues",
    description: "Pinpoint broken links in multi-hop connections and diagnose application unreachability",
  },
  {
    title: "Performance Analysis",
    description: "Diagnose and fix application performance degradation automatically",
  },
  {
    title: "Alert Management",
    description: "Generate intelligent alerts and bug reports from Prometheus based on specific conditions",
  },
  {
    title: "Traffic Configuration",
    description: "Troubleshoot Gateway and HTTPRoute issues for proper traffic management",
  },
];

export function UseCases() {
  return useCases.map((useCase, index) => (
    <Card key={index} className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle>{useCase.title}</CardTitle>
        <CardDescription className="text-gray-400">{useCase.description}</CardDescription>
      </CardHeader>
    </Card>
  ));
}
