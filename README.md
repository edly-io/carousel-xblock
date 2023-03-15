Edly Carousel  ![Pylint Workflow](https://github.com/PakistanX/edly-carousel-xblock/actions/workflows/pylint.yml/badge.svg)
![ESLint workflow](https://github.com/PakistanX/edly-carousel-xblock/actions/workflows/es-lint.yml/badge.svg)
---------------------------------------------

This XBlock allows Course authors to author content which can be displayed on multiple slides.
Each slide can contain combination of Text and Image content.

Installation
------------

Install the requirements into the python virtual environment of your
``edx-platform`` installation by running the following command from the
root folder:

    pip install -e git@github.com:PakistanX/edly-carousel-xblock.git@release-v0.1.8#egg=edly-carousel

Enabling in Studio
------------------

You can enable the Edly Carousel XBlock in studio through the
advanced settings.

1. From the main page of a specific course, navigate to
   `Settings -> Advanced Settings` from the top menu.
2. Check for the ``advanced_modules`` policy key, and add
   ``"edly_carousel"``.
3. Click the `"Save changes"` button.


Settings in studio
------------------

Click `Edit` button to open the studio window, New slides can be added by clicking `Add Slide` button.

#### Summative Assessments

Summative assessments can be authored in carousel, Max Attempts allow course authors to defin a max number of attempts 
available to learner to submit the assessment. `Max Attempts` shouldn't be changed for units which are published and user has 
interacted with those unit as each assessment maintains its own attempt account once it's published.


Running the workbench
---------------------
`python manage.py runserver 8000`

Access it at 

`http://localhost:8000/` <http://localhost:8000>.
