""" Scheme for carousel """

from voluptuous import Required, Schema, Optional
from voluptuous.schema_builder import ALLOW_EXTRA


def to_int(value):
    """ convert the value to int """

    return int(value)


def to_bool(value):
    """ convert to boolean"""

    return value == 'on'


def max_attempts(value):
    """ get int maximum attempts value """

    int_value = int(value)

    return int_value if int_value > 0 else -1


CAROUSEL_SCHEMA = Schema({
    Required('layout'): str,
    Required('passing_msg'): str,
    Required('attempts_text'): str,
    Required('failing_title'): str,
    Required('passing_title'): str,
    Required('is_summative'): bool,
    Required('progressbar_text'): str,
    Optional('passing_marks'): to_int,
    Required('last_attempt_text'): str,
    Required('total_assessments'): to_int,
    Required('marker_passing_score'): str,
    Optional('max_attempts'): max_attempts,
    Required('summative_assessments'): to_int,

    Optional('link_button_text'): str,
    Optional('link_button_url'): str,
    Optional('show_link_button'): to_bool,
    Optional('incomplete_feedback'): str,
    Optional('incomplete_feedback_title'): str,
}, extra=ALLOW_EXTRA)
