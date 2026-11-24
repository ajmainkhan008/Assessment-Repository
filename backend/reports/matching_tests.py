import unittest

from datetime import date
from types import SimpleNamespace

from .matching import (
    normalize,
    levenshtein,
    calculate_match_score,
    find_matches
)


def create_report(
    name,
    description,
    category="Other",
    location="Dhaka",
    incident_date=date(2026, 11, 24)
):

    return SimpleNamespace(

        item_name=name,

        description=description,

        category=category,

        location=location,

        date_of_incident=incident_date

    )


class MatchingTests(unittest.TestCase):

    def test_normalization(self):

        self.assertEqual(
            normalize("BLACK MOBILE PHONE!!!"),
            "black phone"
        )

    def test_synonyms(self):

        self.assertEqual(
            normalize("School Bag"),
            normalize("Backpack")
        )

    def test_spelling_mistakes(self):

        self.assertEqual(
            levenshtein("samsung", "samsng"),
            1
        )

    def test_phone(self):

        lost = create_report(
            "Samsung mobile",
            "Black Samsung Galaxy S24",
            "Electronics"
        )

        found = create_report(
            "Samsung phone",
            "Black Samsng Galaxy S24",
            "Electronics"
        )

        self.assertGreaterEqual(
            calculate_match_score(lost, found),
            60
        )

    def test_wallet(self):

        lost = create_report(
            "Wallet",
            "Brown leather walet",
            "Personal belongings"
        )

        found = create_report(
            "Money bag",
            "Brown leather wallet",
            "Personal belongings"
        )

        self.assertGreaterEqual(
            calculate_match_score(lost, found),
            60
        )

    def test_umbrella(self):

        lost = create_report(
            "Umbrela",
            "Blue folding umbrella",
            "Accessories"
        )

        found = create_report(
            "Umbrella",
            "Blue folding umbrela",
            "Accessories"
        )

        self.assertGreaterEqual(
            calculate_match_score(lost, found),
            60
        )

    def test_calculator(self):

        lost = create_report(
            "Calculator",
            "Silver Casio scientific calculater",
            "Educational"
        )

        found = create_report(
            "Calculator",
            "Silver Casio scientific calculator",
            "Educational"
        )

        self.assertGreaterEqual(
            calculate_match_score(lost, found),
            60
        )

    def test_unknown_product(self):

        lost = create_report(
            "Chess board",
            "Wooden chess bord"
        )

        found = create_report(
            "Chess board",
            "Wooden chess board"
        )

        self.assertGreaterEqual(
            calculate_match_score(lost, found),
            60
        )

    def test_unrelated_items(self):

        lost = create_report(
            "Phone",
            "Black Samsung Galaxy",
            "Electronics"
        )

        found = create_report(
            "Umbrella",
            "Blue folding umbrella",
            "Accessories"
        )

        self.assertLess(
            calculate_match_score(lost, found),
            60
        )

    def test_invalid_date(self):

        lost = create_report(
            "Phone",
            "Black Samsung phone",
            incident_date=date(2026, 11, 24)
        )

        found = create_report(
            "Phone",
            "Black Samsung phone",
            incident_date=date(2026, 11, 15)
        )

        self.assertEqual(
            calculate_match_score(lost, found),
            0
        )

    def test_multiple_matches(self):

        lost = create_report(
            "Wallet",
            "Brown leather wallet"
        )

        found1 = create_report(
            "Wallet",
            "Brown leather wallet"
        )

        found2 = create_report(
            "Wallet",
            "Brown leather walet"
        )

        matches = find_matches(
            [lost],
            [found1, found2]
        )

        self.assertEqual(len(matches), 2)

        self.assertGreaterEqual(
            matches[0]["similarity_score"],
            matches[1]["similarity_score"]
        )


if __name__ == "__main__":

    unittest.main()