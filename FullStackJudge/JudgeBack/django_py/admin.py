
from django.contrib import admin
from django.contrib.auth.models import Group  # <- THIS WAS MISSING
from django.utils.crypto import get_random_string
from .models import Judge,  Contester, JudgeRating

@admin.register(Judge)
class JudgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'surname', 'judge_number', 'user')
    readonly_fields = ('user',)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            username = f'judge_{obj.judge_number}'
            raw_pw = get_random_string(10)

            from django.contrib.auth.models import User
            user = User.objects.create_user(username=username, password=raw_pw)
            user.first_name = obj.name
            user.last_name = obj.surname
            user.save()

            judge_group, _ = Group.objects.get_or_create(name='Judge')
            user.groups.add(judge_group)

            obj.user = user

            self.message_user(request, f"Login created: {username} / {raw_pw}")

        super().save_model(request, obj, form, change)

@admin.register(Contester)
class ContesterAdmin(admin.ModelAdmin):
    list_display = ('name', 'surname', 'competitor_number', 'group', 'club')

@admin.register(JudgeRating)
class JudgeRatingAdmin(admin.ModelAdmin):
    list_display = ('contester', 'judge', 'round_number', 'score', 'timestamp')
    list_filter = ('judge', 'round_number')
