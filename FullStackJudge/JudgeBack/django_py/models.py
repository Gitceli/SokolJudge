
from django.conf import settings
from django.db import models

# --- Judges ---
class Judge(models.Model):
    JUDGE_TYPE_CHOICES = [
        ('execution', 'Execution Judge'),  # Scores rounds (existing functionality)
        ('difficulty', 'Difficulty Judge'),  # Scores difficulty only
    ]

    name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    judge_number = models.CharField(max_length=100)
    is_main_judge = models.BooleanField(default=False)  # Main judge can control active competitor
    judge_type = models.CharField(
        max_length=20,
        choices=JUDGE_TYPE_CHOICES,
        default='execution',
        help_text="Type of judge: execution (rounds) or difficulty (single score)"
    )

    user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="judge_profile",
    null=True,          # ← allow null so Django doesn't complain mid-save
    blank=True          # ← optional in forms/admin
    )

    class Meta:
        ordering = ['judge_number']
        verbose_name = "Judge"
        verbose_name_plural = "Judges"

    def __str__(self):
        return f"{self.name} {self.surname} ({self.judge_number})"


# --- Contesters ---
class Contester(models.Model):
    name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    competitor_number = models.CharField(max_length=100)
    group = models.CharField(max_length=100)
    club = models.CharField(max_length=100)

    # Additional scoring fields
    HD = models.CharField(max_length=200, blank=True)
    Tof = models.CharField(max_length=10000, blank=True)
    D = models.CharField(max_length=200, blank=True)
    P = models.CharField(max_length=200, blank=True)

    active = models.BooleanField(default=False)   # NEW → flagged by the meet official

    class Meta:
        ordering = ['competitor_number']
        verbose_name = "Contester"
        verbose_name_plural = "Contesters"

    def __str__(self):
        return f"{self.name} {self.surname} - {self.competitor_number}"

    def judge_final_scores(self):
        from django.db.models import Max
        return (
            self.ratings
            .values("judge__judge_number")
            .annotate(best_score=Max("score"))
            .order_by("judge__judge_number")
        )


# --- Judge Ratings per Contester ---
class JudgeRating(models.Model):
    contester = models.ForeignKey(Contester, on_delete=models.CASCADE, related_name="ratings")
    judge = models.ForeignKey(Judge, on_delete=models.CASCADE, related_name="ratings")

    round_number = models.PositiveIntegerField()  # 1–10
    score = models.FloatField()  # Jump score
    landing_score = models.FloatField(default=0.0, help_text="Landing score for this jump")
    deduction = models.FloatField(default=0.0, help_text="Deduction in tenths (0.1, 0.2, etc.)")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("contester", "judge", "round_number")  # no duplicate ratings per round per judge

    def __str__(self):
        return f"{self.judge} → {self.contester} [Round {self.round_number}]: {self.score}"


# --- Difficulty Score (separate from execution scoring) ---
class DifficultyScore(models.Model):
    contester = models.ForeignKey(Contester, on_delete=models.CASCADE, related_name="difficulty_scores")
    judge = models.ForeignKey(Judge, on_delete=models.CASCADE, related_name="difficulty_scores")

    difficulty = models.DecimalField(
        max_digits=5,
        decimal_places=3,
        help_text="Difficulty score from 0.000 to 50.000"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("contester", "judge")  # Each difficulty judge scores each contester once

    def __str__(self):
        return f"{self.judge} → {self.contester} [Difficulty]: {self.difficulty}"
