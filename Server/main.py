import cv2
import numpy as np
import json
import sys

def get_document_corners(image_path):
    
    image = cv2.imread(image_path)

    # Convert the image to grayscale
    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(grayscale, (5, 5), 0)

    # Detect edges
    edges = cv2.Canny(blurred, 75, 200)

    # Find contours
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key = cv2.contourArea, reverse = True)[:5]

    # Iterate over the contours and find the one with four points (the document corners)
    for contour in contours:
        # Approximate the contour
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)

        if len(approx) == 4:
            return approx.reshape(4, 2).tolist()

    # No document found
    return None

if __name__ == "__main__":
    image_path = sys.argv[1]  # get image path from command line argument
    corners = get_document_corners(image_path)
    print(corners)
    with open('coordinates.json', 'w') as f:
        json.dump(corners, f)
