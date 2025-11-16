# Change Log

All notable changes to the "DewDew Clock" extension will be documented in this file.

## [1.2511.3] - 2025-11-16

### Fixed
- Fixed README.md image display issues
  - Updated image tag syntax for better compatibility
  - Fixed GIF image alignment and display
  - Improved image path formatting

### Improved
- Updated CHANGELOG.md with comprehensive version history

## [1.2511.2] - 2025-11-16

### Fixed
- Fixed VS Code engine compatibility from ^1.106.0 to ^1.80.0 for better compatibility with Cursor and older VS Code versions
- Fixed Marketplace category: Changed "Productivity" to "Other" (Productivity category is not available in en-us locale)

## [1.2511.1] - 2025-11-16

### Added
- **Responsive Font Size**: Clock font size now automatically adjusts to fit the sidebar width
  - Canvas-based accurate text width measurement
  - Real DOM rendering for optimal font size calculation
  - Debouncing for performance optimization
- **Orbitron Font**: Added Orbitron variable font for modern digital clock display
- **Icon Assets**: Added extension icon image
- **LICENSE**: Added MIT License file

### Improved
- **UI/UX Enhancements**:
  - Fixed left/right padding to 40px for consistent layout
  - Added letter-spacing (0.5px) for better text readability
  - Initial height setting for better initial display
- **Documentation**: Updated README.md with comprehensive feature descriptions

### Changed
- Moved icon image from `images/` to `assets/images/` directory
- Improved font size adjustment algorithm for better accuracy

## [Unreleased]

### Planned
- Coding Time Tracker functionality
- Daily Work Summary feature
