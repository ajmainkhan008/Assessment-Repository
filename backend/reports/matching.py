import re
import unicodedata

from difflib import SequenceMatcher


SYNONYMS = {
    "backpack": [
        "school bag", "rucksack", "back pack"
    ],
    "phone": [
        "mobile phone", "smartphone", "mobile"
    ],
    "laptop": [
        "notebook computer"
    ],
    "wallet": [
        "money bag", "billfold"
    ],
    "earbuds": [
        "ear buds", "wireless buds"
    ],
    "glasses": [
        "spectacles", "eyeglasses"
    ],
    "charger": [
        "charging adapter", "power adapter"
    ],
    "notebook": [
        "exercise books", "exercise book", "notepad"
    ],
    "identification": [
        "identity card", "id card"
    ],
    "lunchbox": [
        "lunch box"
    ],
    "grey": [
        "gray"
    ],
    "bus": [
        "coach"
    ]
}


STOP_WORDS = {
    "a", "an", "the", "my", "his", "her",
    "their", "on", "in", "at", "from",
    "to", "of", "is", "was", "has",
    "have", "some", "inside", "left",
    "lost", "found", "with", "and",
    "it", "this", "that", "i", "bus"
}


MATCH_THRESHOLD = 60


# ----------------------------------------
# TEXT NORMALIZATION
# ----------------------------------------

def normalize(text):

    text = unicodedata.normalize(
        "NFC", str(text or "")
    ).lower()

    text = "".join(
        char if (
            char.isalnum()
            or unicodedata.category(char).startswith("M")
            or char.isspace()
        ) else " "
        for char in text
    )

    text = re.sub(r"\s+", " ", text).strip()

    for word, alternatives in SYNONYMS.items():

        for alternative in alternatives:

            pattern = (
                r"\b" +
                re.escape(alternative) +
                r"\b"
            )

            text = re.sub(
                pattern, word, text
            )

    return text


# ----------------------------------------
# TOKENIZATION
# ----------------------------------------

def tokenize(text):

    words = normalize(text).split()

    return sorted({
        word for word in words
        if word not in STOP_WORDS
    })


# ----------------------------------------
# LEVENSHTEIN DISTANCE
# ----------------------------------------

def levenshtein(a, b):

    previous = list(range(len(b) + 1))

    for i, char_a in enumerate(a, 1):

        current = [i]

        for j, char_b in enumerate(b, 1):

            insertion = current[j - 1] + 1

            deletion = previous[j] + 1

            replacement = previous[j - 1] + (
                char_a != char_b
            )

            current.append(
                min(
                    insertion,
                    deletion,
                    replacement
                )
            )

        previous = current

    return previous[-1]


# ----------------------------------------
# WORD SIMILARITY
# ----------------------------------------

def word_similarity(a, b):

    if not a or not b:
        return 0

    if a == b:
        return 1

    if len(a) < 4 or len(b) < 4:
        return 0

    if any(char.isdigit() for char in a + b):
        return 0

    distance = levenshtein(a, b)

    return 1 - (
        distance / max(len(a), len(b))
    )


# ----------------------------------------
# FUZZY JACCARD SIMILARITY
# ----------------------------------------

def text_similarity(text_a, text_b):

    words_a = tokenize(text_a)

    words_b = tokenize(text_b)

    if not words_a or not words_b:
        return 0

    candidates = []

    for i, word_a in enumerate(words_a):

        for j, word_b in enumerate(words_b):

            score = word_similarity(
                word_a, word_b
            )

            if score >= 0.75:

                candidates.append(
                    (score, i, j)
                )

    candidates.sort(reverse=True)

    used_a = set()
    used_b = set()

    matched = 0

    for score, i, j in candidates:

        if i not in used_a and j not in used_b:

            matched += score

            used_a.add(i)
            used_b.add(j)

    union = (
        len(words_a) +
        len(words_b) -
        matched
    )

    return matched / union if union else 0


# ----------------------------------------
# ITEM NAME SIMILARITY
# ----------------------------------------

def name_similarity(name_a, name_b):

    a = normalize(name_a)
    b = normalize(name_b)

    if not a or not b:
        return 0

    fuzzy_score = text_similarity(a, b)

    sequence_score = SequenceMatcher(
        None, a, b
    ).ratio()

    return max(
        fuzzy_score,
        sequence_score
    )


# ----------------------------------------
# CATEGORY SIMILARITY
# ----------------------------------------

def category_similarity(category_a, category_b):

    a = normalize(category_a)
    b = normalize(category_b)

    unknown_values = {
        "", "other", "unknown", "others"
    }

    if a in unknown_values or b in unknown_values:
        return None

    if a == b:
        return 1

    return text_similarity(a, b)


# ----------------------------------------
# LOCATION SIMILARITY
# ----------------------------------------

def location_similarity(location_a, location_b):

    a = normalize(location_a)
    b = normalize(location_b)

    if not a or not b:
        return None

    if a == b:
        return 1

    return text_similarity(a, b)


# ----------------------------------------
# DATE SIMILARITY
# ----------------------------------------

def date_similarity(lost_date, found_date):

    if not lost_date or not found_date:
        return None

    difference = (
        found_date - lost_date
    ).days

    if difference < -1:
        return 0

    if difference <= 1:
        return 1

    if difference <= 3:
        return 0.8

    if difference <= 7:
        return 0.5

    if difference <= 15:
        return 0.25

    return 0


# ----------------------------------------
# FINAL WEIGHTED SCORE
# ----------------------------------------

def calculate_match_score(lost, found):

    if lost.date_of_incident and found.date_of_incident:

        difference = (
            found.date_of_incident -
            lost.date_of_incident
        ).days

        if difference < -1:
            return 0

    name_score = name_similarity(
        lost.item_name,
        found.item_name
    )

    description_score = text_similarity(
        lost.description,
        found.description
    )

    category_score = category_similarity(
        lost.category,
        found.category
    )

    location_score = location_similarity(
        lost.location,
        found.location
    )

    incident_score = date_similarity(
        lost.date_of_incident,
        found.date_of_incident
    )

    # Prevent unrelated items from matching
    # based only on location, category or date.

    if name_score < 0.40 and description_score < 0.30:
        return 0

    # Require stronger evidence when categories differ.

    if category_score == 0:

        if name_score < 0.75 and description_score < 0.65:
            return 0

    fields = [
        (name_score, 35),
        (description_score, 35),
        (category_score, 10),
        (location_score, 10),
        (incident_score, 10)
    ]

    earned_score = 0

    available_weight = 0

    for similarity, weight in fields:

        if similarity is None:
            continue

        earned_score += similarity * weight

        available_weight += weight

    if available_weight == 0:
        return 0

    final_score = (
        earned_score /
        available_weight
    ) * 100

    return round(final_score, 2)


# ----------------------------------------
# GENERATE AND RANK POTENTIAL MATCHES
# ----------------------------------------

def find_matches(
    lost_reports,
    found_reports,
    threshold=MATCH_THRESHOLD
):

    matches = []

    found_reports = list(found_reports)

    for lost in lost_reports:

        for found in found_reports:

            score = calculate_match_score(
                lost, found
            )

            if score >= threshold:

                matches.append({
                    "lost_report": lost,
                    "found_report": found,
                    "similarity_score": score
                })

    matches.sort(
        key=lambda match: match["similarity_score"],
        reverse=True
    )

    return matches