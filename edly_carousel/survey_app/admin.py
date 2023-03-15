import csv
from datetime import datetime
from django.contrib import admin
from django.http import HttpResponse

from .models import SurveyResponseModel


def export_to_csv(model_admin, request, queryset):    # pylint: disable=unused-argument
    opts = model_admin.model._meta  # pylint: disable=protected-access
    content_disposition = 'attachment; filename={}.csv'.format(opts.verbose_name)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = content_disposition
    writer = csv.writer(response)

    fields = [field for field in opts.get_fields() if not field.many_to_many and not field.one_to_many]
    # Write a first row with header information
    writer.writerow([field.verbose_name for field in fields])
    # Write data rows
    for obj in queryset:
        data_row = []
        for field in fields:
            value = getattr(obj, field.name)
            if isinstance(value, datetime):
                value = value.strftime('%d/%m/%Y')
            data_row.append(value)
        writer.writerow(data_row)
    return response


export_to_csv.short_description = 'Export to CSV'


@admin.register(SurveyResponseModel)
class SurveyResponseModelAdmin(admin.ModelAdmin):
    """
    Admin interface for SurveyResponseModel object
    """

    search_fields = ['course_id']
    list_display_links = ['user', 'course_id']
    list_filter = ['question', 'course_id']
    list_display = ['user', 'course_id', 'question', 'response']
    actions = [export_to_csv]
