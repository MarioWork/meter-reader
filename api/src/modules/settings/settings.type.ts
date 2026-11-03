// The subject and body every reading's email is filled in from, for the modules that build that email.
export type MessageTemplates = { subject: string; body: string };

// What goes in place of each placeholder: the reading as read, and the day already spelled out.
export type MessageValues = { reading: string; date: string };
