# Centro VIAS – Test Cases

## 1. Testing Scope

The initial testing phase focuses on the frontend implementation of the Centro VIAS website, which currently consists of HTML and CSS pages.

The purpose is to verify that the pages display correctly, navigation works as expected, and the website provides a consistent experience across different screen sizes.

### Pages Included

1. Landing Page
2. Activities Page
3. Donations Page
4. Admin Page
5. Contact and Admissions Page
6. Meet the Team Page

## 2. Test Cases

### TC-001: Page Loading

- **Objective:** Verify that each website page loads correctly.
- **Preconditions:** The website files are available locally.
- **Steps:**
  1. Open the website in a browser.
  2. Navigate to each of the six pages.
  3. Observe whether the page loads without errors.
- **Expected Result:** Each page loads successfully and displays its content and layout correctly.
- **Actual Result:** All six pages loaded successfully in the browser.
- **Status:** Pass

### TC-002: Navigation Links

- **Objective:** Verify that the website's navigation links direct users to the correct pages.
- **Steps:**
  1. Open the Landing Page.
  2. Click each navigation link.
  3. Verify that the correct destination page opens.
  4. Repeat the process from other pages where navigation is available.
- **Expected Result:** Each navigation link directs users to its corresponding page without broken links.
- **Actual Result:** All navigation links successfully directed users to their corresponding pages. Navigation was verified from the Landing Page and other website pages.
- **Status:** Pass

### TC-003: Page Content and Layout

- **Objective:** Verify that each page displays its intended content and visual elements.
- **Steps:**
  1. Open each website page.
  2. Review the text, images, headings, and other visual elements.
  3. Check for overlapping elements, missing content, or unexpected spacing.
- **Expected Result:** All page elements display correctly and follow the intended design.
- **Actual Result:** The website pages displayed their content and layout; however, inconsistencies were found in the organization's name. In several instances, "VIAS" was written as "Vías".
- **Status:** Fail

### TC-004: CSS Styling

- **Objective:** Verify that the CSS styles are correctly applied to each page.
- **Steps:**
  1. Open each website page.
  2. Observe the colors, fonts, spacing, alignment, and other styling elements.
  3. Verify that the intended styles are applied consistently.
- **Expected Result:** Each page displays the intended styling without missing or incorrectly applied CSS.
- **Actual Result:** All six website pages displayed the intended colors, fonts, spacing, and alignment. No visible CSS styling issues were identified.
- **Status:** Pass

### TC-005: Responsive Layout

- **Objective:** Verify that the website layout adapts to different screen sizes.
- **Steps:**
  1. Open each page in a browser.
  2. Use the browser's developer tools to simulate desktop, tablet, and mobile screen sizes.
  3. Observe the layout and check for horizontal scrolling, overlapping elements, or content that becomes inaccessible.
- **Expected Result:** The pages remain readable and usable across the tested screen sizes.
- **Actual Result:** All pages displayed correctly on laptop and mobile screen sizes, except for the Admin Page, which does not currently have a responsive layout.
- **Status:** Fail

### TC-006: Image Display

- **Objective:** Verify that images used throughout the website load and display correctly.
- **Steps:**
  1. Open each website page.
  2. Inspect the images.
  3. Check for missing images, broken image paths, or incorrect image proportions.
- **Expected Result:** All intended images load correctly and maintain appropriate proportions.
- **Actual Result:** The organization has not yet provided the images intended for the website. Image display testing will be performed once the images are received and added.
- **Status:** Not Tested

## 3. Test Execution Summary

| Test Case | Description | Status |
|---|---|---|
| TC-001 | Page Loading | Pass |
| TC-002 | Navigation Links | Pass |
| TC-003 | Page Content and Layout | Fail |
| TC-004 | CSS Styling | Pass |
| TC-005 | Responsive Layout | Fail |
| TC-006 | Image Display | Not Tested |