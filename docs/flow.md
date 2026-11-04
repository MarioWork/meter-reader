# How Meter Reader works

Words follow `docs/GLOSSARY.md`. Decisions behind the flow are in `docs/adr/`.

## The pieces

```mermaid
flowchart LR
    phone["Phone<br/>(web app, PWA)"]
    api["api<br/>(Fastify)"]
    db[("Postgres<br/>readings, photos, bills,<br/>login, mail connection")]
    uploads[("./data/uploads<br/>photo and bill files")]
    ms["Microsoft<br/>sign-in + Graph sendMail"]
    provider["Provider<br/>inbox"]

    phone -- "session cookie" --> api
    api --> db
    api --> uploads
    api -- "Mail.Send token" --> ms
    ms -- "email from the user's Hotmail" --> provider
```

## One-time setup (on the server)

```mermaid
flowchart TD
    start(["api starts for the first time"]) --> setupLink["Prints a one-time /setup?code=… link"]
    setupLink --> setup["User opens it, sets a password and/or a passkey"]
    setup --> signedIn(["Signed in"])

    reg["Register the app with Microsoft<br/>(docs/guide/hotmail.md, once)"] --> connect["yarn mail:connect"]
    connect --> code["Prints a code + microsoft.com/devicelogin"]
    code --> approve["User approves on their phone"]
    approve --> saved(["Token saved; refreshed every 30 min"])

    lost["Forgot the login?"] --> reset["yarn auth:reset<br/>prints a new setup link"]
    reset --> setup
```

## Taking and sending a reading

```mermaid
flowchart TD
    open(["Open the app"]) --> session{"Signed in?"}
    session -- "no login yet" --> setupPage["/setup"]
    session -- "no" --> login["/login<br/>password or passkey"]
    session -- "yes" --> home
    login --> home

    home["/home: history<br/>date · reading · photo · status"]
    home --> banner{"Hotmail connected?"}
    banner -- "no" --> warn["Banner: run yarn mail:connect"]

    home -- "New reading" --> newReading["/readings/new"]
    newReading --> photo{"Add a photo?"}
    photo -- "camera or file" --> shrink["Phone shrinks it:<br/>JPEG, ≤ 2000 px, ≤ 2.5 MB<br/>(gives up after ~15 s)"]
    shrink --> crop["User boxes the digit window<br/>and turns it upright, or skips"]
    crop --> ocr["Tesseract reads that part<br/>in the browser, offline<br/>(gives up after ~20 s)"]
    ocr --> field["Reading field filled in<br/>(user checks and can fix it)"]
    photo -- "no" --> type["User types the reading"]
    field --> save
    type --> save
    save["Save"] --> lower{"Lower than the newest reading?"}
    lower -- "yes" --> warning["Warning, but saving still works"] --> stored
    lower -- "no" --> stored["POST /photos, then POST /readings<br/>status: Not sent"]
    stored --> home

    home -- "Send / Try again" --> preview["Preview: to, subject, body,<br/>Attach photo toggle"]
    preview --> canSend{"Hotmail connected?"}
    canSend -- "no" --> blocked["Send is disabled"]
    canSend -- "yes" --> mailSend["api sends through Graph sendMail"]
    mailSend -- "accepted" --> sent["Sent + time"]
    mailSend -- "refused / never got" --> failed["Failed + the server's reason"]
    sent --> home
    failed --> home

    home -- "Delete" --> confirm{"Confirm dialog"}
    confirm -- "cancel" --> home
    confirm -- "delete" --> gone["Reading and its photo file removed"] --> home
```

## A reading's status

Every reading starts as **Not sent**. Sending moves it to **Sent** or **Failed**. A failed one can be tried again.

```mermaid
flowchart LR
    notSent["Not sent"] -- "Send works" --> sent["Sent"]
    notSent -- "Send fails" --> failed["Failed"]
    failed -- "Try again works" --> sent
```

If Try again fails too, the reading stays **Failed**. Any reading can be deleted, whatever its status.
