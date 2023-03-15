"""Setup for edly_carousel XBlock."""

from __future__ import absolute_import

import os

from setuptools import setup


def package_data(pkg, roots):
    """Generic function to find package_data.

    All of the files under each of the `roots` will be declared as package
    data for package `pkg`.

    """
    data = []
    for root in roots:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}


setup(
    name='edly_carousel-xblock',
    version='0.2.1',
    author='Edly Enterprise',
    description='edly_carousel XBlock creates a Carousel with multiple pages and dynamic content '
                'for each page i.e Audio, Video, Image & Text',
    license='',
    packages=[
        'edly_carousel',
    ],
    install_requires=[
        'XBlock',
    ],
    entry_points={
        'xblock.v1': [
            'edly_carousel = edly_carousel:EdlyCarouselXBlock',
        ]
    },
    package_data=package_data("edly_carousel", ["public", "templates"]),
)
