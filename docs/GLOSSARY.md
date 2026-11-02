# Meter Reader

One person takes a photo of their water meter, the app reads the number, and emails it to their water provider. One user, one meter, one provider.

## Language

**Meter**:
The user's one water meter, whose digit window shows how much water has passed through it.
_Avoid_: Counter, gauge

**Reading**:
The number shown on the meter at one moment, kept exactly as read: every digit, leading zeros kept, red digits included.
_Avoid_: Value, count, measurement

**Photo**:
The picture of the meter that a reading was taken from, attached to its email.
_Avoid_: Image, picture, scan

**Provider**:
The water company that receives the readings by email, at one fixed address.
_Avoid_: Supplier, utility, company

**Send**:
Emailing one reading, with its photo, from the user's own mail account to the provider.
_Avoid_: Submit, upload, report

**Sent**:
A reading whose email the mail service accepted.

**Failed**:
A reading whose email the mail service refused or never got; it can be sent again.
_Avoid_: Error, rejected

**History**:
The list of past readings, newest first, each with its date, photo and whether it was sent or failed.
_Avoid_: Log, archive
