export interface NetworkingEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  organizer: string;
  location: string;
  tags: string[];
}

export interface Participant {
  id: number;
  fullName: string;
  email: string;
  registeredAt: string;
}
