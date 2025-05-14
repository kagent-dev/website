export interface Author {
  id: string;
  name: string;
  title: string;
  photo: string;
  bio: string;
}

export const authors: Author[] = [
  {
    id: 'christianposta',
    name: 'Christian Posta',
    title: 'VP, Global Field CTO',
    photo: '/images/authors/christian-posta.png',
    bio: 'Christian Posta (@christianposta) is Global Field CTO at Solo.io supporting customers and end users in their adoption of cloud-native technologies. He is an author for Manning and O’Reilly publications, open source contributor, blogger and sought after speaker on Envoy Proxy and Kubernetes technologies. Prior to Solo.io, Chrisitan was a Chief Architect at Red Hat, FuseSource and held engineering positions at organizations like Wells Fargo, Apollo Group, Intel.',
  },
];

export const getAuthorById = (id: string): Author | undefined => {
  return authors.find(author => author.id === id);
}; 