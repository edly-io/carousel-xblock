"""Models for survey app"""
from django.db import models

from opaque_keys.edx.django.models import CourseKeyField # pylint: disable=import-error


class SurveyResponseModel(models.Model):
    """Model to store user's response against particular Survey"""

    user = models.CharField(max_length=128)
    question = models.CharField(max_length=128)
    response = models.CharField(max_length=512)  # All selections for MRQ will be stored
    course_id = CourseKeyField(max_length=128, blank=True, null=True, default=None)
    created_at = models.DateField(auto_now_add=True, blank=True)

    def __str__(self):
        return "{} submitted {}".format(self.user, self.question)
