#!/bin/bash

# Get the current date and time for the publication date
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Prompt the user to enter required information for the article
read -p "Please enter the title of the article: " title
read -p "Please enter the category of the article: " category

# Ask for confirmation to use .md as file extension
read -p "Do you want to use .md as the file extension? (Y/n): " confirm_extension

# Set default file extension to .md
file_extension=".md"
if [[ $confirm_extension =~ ^[Nn] ]]; then
  # Allow user to specify another file extension if they do not want to use .md
  read -p "Please enter the file extension you want to use: " custom_extension
  file_extension=$custom_extension
fi

# Generate the filename based on the title and chosen file extension
filename=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')$file_extension

# Remove spaces and illegal characters from the category
category=$(echo "$category" | tr -d '[:space:]' | tr -d '[:punct:]')

# Concatenate the file path
filepath="./src/content/posts/$filename"

# Check if the file already exists
if [ -f "$filepath" ]; then
  echo "Error: File already exists!"
  exit 1
fi

# Create a new article file and write the header information
{
  echo "---"
  echo "title: $title"
  echo "pubDate: $timestamp"
  echo "categories: "
  echo "  - $category"
  echo "description: ''"
  echo "---"
  echo ""
} > "$filepath"

echo "Successfully created a new article with file extension '$file_extension': $filepath"