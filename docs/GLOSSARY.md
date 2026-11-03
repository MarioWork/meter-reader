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

**Template**:
The subject or the body every reading's email starts from, set in Settings, with placeholders where the reading and its date go. A reading not sent yet is filled in from the current templates; a sent one keeps the email it went out with.
_Avoid_: Format, pattern, default message

**Placeholder**:
A name in braces in a template, filled in when the email is made: `{reading}` is the reading as read, `{date}` the day it was read. Only these two exist, in the subject and in the body; anything else in braces is refused.
_Avoid_: Variable, tag, token, field

**Date format**:
How `{date}` is written in every email, chosen in Settings: `31 October 2026` (a fresh install's), `31 Oct 2026`, `31/10/2026` or `2026-10-31`. Only the email follows it; the app shows its own dates its own way.
_Avoid_: Date style, date pattern

**Send**:
Emailing one reading, with its photo unless the user leaves it out, from the user's own mail account to the provider.
_Avoid_: Submit, upload, report

**Not sent**:
A reading that is saved but whose email has not gone out yet. Every reading starts here.

**Sent**:
A reading whose email the mail service accepted.

**Failed**:
A reading whose email the mail service refused or never got; it can be sent again.
_Avoid_: Error, rejected

**History**:
The list of past readings, newest first, each with its date, photo and whether it was sent or failed.
_Avoid_: Log, archive

**Cost**:
What one reading cost, in euros, with up to 2 decimals and never below 0. Added after the reading is saved; a reading may have none.
_Avoid_: Total, price, amount, paid

**Bill**:
The provider's bill file for one reading (PDF, JPEG or PNG), added after the reading is saved. Never part of its email; a reading may have none.
_Avoid_: Invoice, attachment, receipt
