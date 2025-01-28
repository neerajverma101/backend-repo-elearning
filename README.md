# eLearning Platform - Backend REST API

This document outlines the core functionalities and endpoints of the eLearning platform backend REST API.

## Endpoints

**1. Organization**

* **`/organizations`**
    * **POST:** Create a new organization.
    * **GET:** Retrieve a list of all organizations.
    * **GET:** Retrieve a specific organization by ID.
    * **PUT:** Update an existing organization.
    * **DELETE:** Delete an organization (soft delete recommended).

**2. Branch**

* **`/branches`**
    * **POST:** Create a new branch under a specific organization (requires organization ID).
    * **GET:** Retrieve a list of branches for a specific organization.
    * **GET:** Retrieve a specific branch by ID.
    * **PUT:** Update an existing branch.
    * **DELETE:** Delete a branch (soft delete recommended).

**3. Teacher**

* **`/teachers`**
    * **POST:** Create a new teacher.
    * **GET:** Retrieve a list of teachers for a specific branch.
    * **GET:** Retrieve a specific teacher by ID.
    * **PUT:** Update an existing teacher.
    * **DELETE:** Delete a teacher (soft delete recommended).
    * **POST:** `/teachers/{teacherId}/verify`: Verify teacher account.

**4. Student**

* **`/students`**
    * **POST:** Create a new student.
    * **GET:** Retrieve a list of students for a specific branch.
    * **GET:** Retrieve a specific student by ID.
    * **PUT:** Update an existing student.
    * **DELETE:** Delete a student (soft delete recommended).
    * **POST:** `/students/{studentId}/verify`: Verify student account.

**5. Class**

* **`/classes`**
    * **POST:** Create a new class under a specific branch (requires branch ID).
    * **GET:** Retrieve a list of classes for a specific branch.
    * **GET:** Retrieve a specific class by ID.
    * **PUT:** Update an existing class.
    * **DELETE:** Delete a class (soft delete recommended).

**6. Class-Teacher Relationship**

* **`/classes/{classId}/teachers`**
    * **POST:** Assign a teacher to a class.
    * **DELETE:** Remove a teacher from a class.

**7. Student-Class Enrollment**

* **`/classes/{classId}/students`**
    * **POST:** Enroll a student in a class.
    * **DELETE:** Unenroll a student from a class.

**8. Online Classes**

* **`/classes/{classId}/schedules`**
    * **POST:** Schedule a new online class.
    * **GET:** Retrieve a list of class schedules.
    * **GET:** Retrieve a specific class schedule by ID.
    * **PUT:** Update an existing class schedule. 
    * **DELETE:** Cancel a scheduled class.
* **`/classes/{classId}/schedules/{scheduleId}/start`:** Start an online class session.
* **`/classes/{classId}/schedules/{scheduleId}/stop`:** Stop an online class session.

**9. Recordings and Transcripts**

* **`/classes/{classId}/schedules/{scheduleId}/recordings`** 
    * **GET:** Download a recording of a class session.
* **`/classes/{classId}/schedules/{scheduleId}/transcripts`** 
    * **GET:** Download a transcript of a class session.

## eLearning Platform Links

* **eLearning Portal:** https://repo-elearning-dev.vercel.app
* **eLearning REST API:** https://backend-repo-elearning.onrender.com/api
* Username: admin@yopmail.com
* Password: admin