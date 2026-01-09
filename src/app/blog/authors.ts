export interface Author {
  id: string;
  name: string;
  title: string;
  photo: string;
  bio: string;
}

export const authors: Author[] = [
  {
    id: 'antweiss',
    name: 'Ant Weiss',
    title: 'Cluster Whisperer',
    photo: '/images/authors/antweiss.png',
    bio: 'Ant Weiss (@antweiss) is a Cluster Whisperer at PerfectScale.io, focusing on cloud-native technologies and open-source projects.Software delivery optimization expert and Kubernetes fanboy.',
  },
  {
    id: 'christianposta',
    name: 'Christian Posta',
    title: 'VP, Global Field CTO',
    photo: '/images/authors/christian-posta.png',
    bio: 'Christian Posta (@christianposta) is Global Field CTO at Solo.io supporting customers and end users in their adoption of cloud-native technologies. He is an author for Manning and O’Reilly publications, open source contributor, blogger and sought after speaker on Envoy Proxy and Kubernetes technologies. Prior to Solo.io, Chrisitan was a Chief Architect at Red Hat, FuseSource and held engineering positions at organizations like Wells Fargo, Apollo Group, Intel.',
  },
  {
    id: 'linsun',
    name: 'Lin Sun',
    title: 'Head of Open Source',
    photo: '/images/authors/linsun.jpg',
    bio: 'Lin is the Head of Open Source at Solo.io, and a CNCF TOC member and ambassador. She has worked on the Istio service mesh since the beginning of the project in 2017 and serves on the Istio Technical Oversight Committee. Previously, she was a Senior Technical Staff Member and Master Inventor at IBM for 15+ years. She is the author of the book "Sidecar-less Istio Explained" and has more than 200 patents to her name.',
  },
  {
    id: "jetchiang",
    name: "Jet Chiang",
    title: "Linux Foundation Mentee",
    photo: "/images/authors/jetchiang.jpg",
    bio: "Jet is an aspiring machine learning engineer + researcher studying at the University of Toronto. He is the Linux Foundation Mentee at Kagent for 2025.",
  },
  {
    id: "michaellevan",
    name: "Michael Levan",
    title: "Principal Solutions Engineer",
    photo: "/images/authors/michaellevan.jpeg",
    bio: "Michael Levan translates technical complexity into practical value. He's a seasoned engineer, consultant, trainer, and content creator in the Kubernetes and Agentic space. Michael is a Microsoft MVP (Azure), 4x published author, podcast host, international public speaker, CNCF Ambassador, and was part of the Kubernetes v1.28 and v1.31 Release Team.",
  },
];

export const getAuthorById = (id: string): Author | undefined => {
  return authors.find(author => author.id === id);
}; 