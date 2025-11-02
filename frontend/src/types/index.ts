export interface User {
  _id: string;
  email: string;
  role: string;
  settlements: Settlement[];
}

export interface Settlement {
  _id: string;
  name: string;
  judet: string;
  lat: number;
  lng: number;
  active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

export interface BlogPost {
  _id: string;
  title: string;
  description: string;
  content: string;
  settlement: string;
  date: Date;
}

export interface WebsiteComponent {
  id: string;
  type:
    | "header"
    | "hero"
    | "about"
    | "services"
    | "contact"
    | "footer"
    | "blog"
    | "map";
  content: {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    links?: Array<{ text: string; url: string }>;
  };
  position: number;
  alignment: "left" | "center" | "right";
}

export interface WebsitePreview {
  settlementId: string;
  components: WebsiteComponent[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}
