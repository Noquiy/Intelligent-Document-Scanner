import cv2
import json
import sys
import os
import numpy as np
from pathlib import Path

image = Path(sys.argv[1])


img = cv2.imread(str(image))


gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


pixels = gray.flatten().reshape(img.shape[:2])


denoised = cv2.fastNlMeansDenoising(gray, h=10)

threshold = np.percentile(denoised, 40)

bright_pixels = np.where(denoised >= threshold, 255, 0).astype('uint8')




kernel = np.ones((5,5),np.uint8)
opened = cv2.morphologyEx(bright_pixels, cv2.MORPH_OPEN, kernel)


contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)



contour_areas = [cv2.contourArea(contour) for contour in contours]
average_contour_area = np.mean(contour_areas)
large_contours = [contour for contour in contours if cv2.contourArea(contour) > average_contour_area]


canvas = np.zeros_like(opened)
cv2.drawContours(canvas, large_contours, -1, 255, thickness=cv2.FILLED)


sorted_contours = sorted(large_contours, key=cv2.contourArea, reverse=True)
largest_contour = sorted_contours[0]


canvas = np.zeros_like(opened)
draw_countours = cv2.drawContours(canvas, [largest_contour], -1, 255, thickness=cv2.FILLED)


rect = cv2.minAreaRect(largest_contour)

box = cv2.boxPoints(rect)
box = np.int0(box)


image_copy = img.copy()
cv2.drawContours(image_copy,[box],0,(0,0,255),2)

height, width, channels = image_copy.shape

coordinates = box.tolist()
json_string_corners = json.dumps({"corners": coordinates})


dimensions_dict = {"height": height, "width": width}


json_string_dimensions = json.dumps(dimensions_dict)

image_dir = image.parent
with open(image_dir/'coordinates.json', 'w') as file:
    file.write(json_string_corners)
    
with open(image_dir/'dimensions.json', 'w') as file:
    file.write(json_string_dimensions)
    

