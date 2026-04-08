export const typeDefs = `#graphql
  type User {
    id: Int!
    email: String!
    full_name: String!
    role: String!
    created_at: String!
  }

  type Event {
    id: Int!
    title: String!
    description: String!
    date: String!
    organizer: String!
    location: String!
    tags: [String!]!
    creator_id: Int
    creator: User
    participants: [Participant!]!
    participant_count: Int!
  }

  type Participant {
    id: Int!
    event_id: Int!
    full_name: String!
    email: String!
    registered_at: String!
  }

  type EventsResult {
    data: [Event!]!
    total: Int!
  }

  input AddEventInput {
    title: String!
    description: String
    date: String!
    organizer: String
    location: String
    tags: [String!]
  }

  input UpdateEventInput {
    title: String
    description: String
    date: String
    organizer: String
    location: String
    tags: [String!]
  }

  input AddParticipantInput {
    event_id: Int!
    full_name: String!
    email: String!
  }

  type Query {
    getEvents(limit: Int, skip: Int, search: String, sort: String, order: String): EventsResult!
    getEvent(id: Int!): Event
    getParticipants(eventId: Int!, limit: Int, skip: Int): [Participant!]!
    me: User
  }

  type Mutation {
    addEvent(input: AddEventInput!): Event!
    updateEvent(id: Int!, input: UpdateEventInput!): Event!
    deleteEvent(id: Int!): Boolean!
    addParticipant(input: AddParticipantInput!): Participant!
    deleteParticipant(eventId: Int!, participantId: Int!): Boolean!
  }
`;
