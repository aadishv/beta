---
date: "2025-03-24"
title: "Using code to simplify a repetitive task"
---

The post I wrote yesterday was quite the beast, so today I'll keep it short :)

## The problem

Halfway through each semester, before a break, OHS has a spirit week, where grades compete to win the most points. Last fall, us middle schoolers dominated, but this spring, we were demoted to third place 😭

_Anyways_, one way to earn points for your grade is to send eKudos to your friends (or anyone, or teachers, etc.). This year, I am volunteering on OHS's Board of Communications, where we made a Google Form to collect the messages. Now we have a spreadsheet of about 1700 messages to send.

Clearly, the manual way to do this is not ideal.

1. Choose a person.
2. Make a list of all of the messages sent to that person.
3. Copy and paste those messages into a template.
4. Copy and paste the template into an email.
5. Send the email.
6. Repeat steps 1-5 for the ~700 people an eKudo was sent to.

Somehow, our fabulous board chair, Piper, managed to do this all herself last fall, but this is 2025, we shouldn't have to subject humans to doing this kind of thing.

## Code to the rescue

This is obviously a match for a simple script. As usual for these small projects, I used Python with `uv`. We start off by exporting the spreadsheet to a TSV file, which looks something like this:

```TSV
fakeuser1@ohs.stanford.edu	Hey! Hope you're having a great week. Thanks for being such a positive influence in class!
fakeuser2@ohs.stanford.edu	Just wanted to say you're doing awesome! Keep up the great work.
fakeuser3@ohs.stanford.edu	Thanks for always being willing to help out. You're a true friend!
fakeuser4@ohs.stanford.edu	I really appreciate your insights in our discussions. You bring a unique perspective.
fakeuser5@ohs.stanford.edu	You're so creative! I love seeing your projects and ideas.
fakeuser6@ohs.stanford.edu	Thanks for making me laugh every day. You're hilarious!
fakeuser7@ohs.stanford.edu	I admire your dedication and hard work. You're an inspiration.
fakeuser8@ohs.stanford.edu	You're a great listener. Thanks for always being there when I need to talk.
fakeuser9@ohs.stanford.edu	Just wanted to send some positive vibes your way! Have a fantastic day.
fakeuser10@ohs.stanford.edu	You're such a kind and caring person. The world needs more people like you.
fakeuser11@ohs.stanford.edu	Thanks for being a great team member. I appreciate your contributions.
fakeuser12@ohs.stanford.edu	You're so talented! I'm always impressed by your skills.
fakeuser13@ohs.stanford.edu	Just wanted to let you know you're appreciated. Keep shining!
```

(the real messages were, of course, slightly more unhinged)

Luckily for me, the TSV was sorted by alphabetical order, meaning each email's messages were grouped together. Thus, a simple for-loop was enough. For a first try, I quickly hacked together a script which used `mailto:` urls that one could click on to open Gmail, with the recipient, message title, and body already filled out, with just the send button waiting to be pressed. It also put each message in a HTML `a` tag so I could upload it to Codepen and share it that way. This worked great on my end, but...

![uh-oh](/assets/ekudos.png)

Ah yes, the classic Microsoft frustrations. I asked Copilot what I could do to make it work, and it told me that Gmail had its own `mailto` equivalent which directly sent the user to gmail (instead of a random mail app). This quick change made the script work perfectly! :D

The script itself is very simple:

```python
from urllib.parse import quote


def generate_mailto_url(receiver_address: str, title: str, body: str) -> str:
    """
    Generates a mailto URL with the specified sender, receiver, title, and body.

    Args:
        sender_address: The email address of the sender (not directly included in the URL,
                        but provided for context or potential future use).
        receiver_address: The email address of the recipient.
        title: The subject line of the email.
        body: The body text of the email.

    Returns:
        A string representing the mailto URL.
    """
    subject = quote(title)

    body = quote(body)
    mailto_url = f"https://mail.google.com/mail/?view=cm&fs=1&to={receiver_address}&su={subject}&body={body}"
    return mailto_url


TEMPLATE1 = "Hey Pixel! Hope you're having a wonderful day! Lots of love, Pixel"
TEMPLATE2 = (
    "Thank you for being a great student and a wonderful member of the OHS community!"
)
TEMPLATE3 = """With love,
-Pixel"""
data = open("ekudos.csv").read().split("\n")
person = data[0].split("\t")[0]
things = []


def geturl(p, ts):
    s = (
        TEMPLATE1
        + "\n---\n"
        + "\n---\n".join(things)
        + "\n---\n"
        + TEMPLATE2
        + "\n"
        + TEMPLATE3
    )
    return generate_mailto_url(p, "eKudo!", s)


i = 1
for line in data:
    if len(line) == 0:
        continue
    vs = line.split("\t")
    nextperson = vs[0]

    content = vs[1]
    if nextperson != person:
        print(f"<a href='{geturl(person, things)}'>email {i}</a>")
        person = nextperson
        i += 1
        things = []
    things.append(content)
print(f"<a href='{geturl(person, things)}'>email {i}</a>")
```

Much of it is ai-generated but the core `for` loop at the end is handwritten. Of course this could be refactored in 10 different ways, but it did the job.

## Epilogue

This ended up dramatically speeding up the process of sending the eKudos! It feels nice to be able to make the world a little bit better, even if it's just with a 30-line, hacked-together Python script. Thanks for reading!
