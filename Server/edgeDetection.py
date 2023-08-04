import numpy as np
import cv2
import sys
import json
import os
from pathlib import Path

class FileExplorer:
    def __init__(self):
        self.makeDirectory()
    
    def makeDirectory(self):
        folder_name = sys.argv[1]
        _path = '/uploads'
        os.mkdir(os.path.join(_path, folder_name))
         

class DocumentScanner: 
    def __init__ (self):
        self.uploadedImage = None
        self.edgesImage = None
        self.ordered_points = None
        self.destination_corners = None
    
    def receive_image(self, image_path):
        self.uploadedImage = cv2.imread(image_path)
        self.rescale_image()
        self.content_deletion()
        self.color_segmentation()
        self.denoise_image()
        self.delete_background()
        self.detect_edges()
        self.find_outline()
        
    def get_edge_coordinates(self):
        self.find_outline()
        with open('coordinates.json', 'w') as file:
            file.write(json.dumps(self.ordered_points))# return the coordinates of the corners of the document in the image
    
    def receive_user_coordinates(self, user_coordinates):
        self.ordered_points = user_coordinates  # update the coordinates with user provided ones
        self.document_transform() # apply transformations with the updated coordinates
        
    def get_transformed_image(self):
        self.scan_image()
        return self.final  # return the final transformed image
        
    def rescale_image(self, max_height = 1280):
        self.max_height = max_height
        # Get the dimensions of the image
        height, width = self.uploadedImage.shape[:2]
        
        # If the image height is greater than max_height, calculate the ratio and resize
        if height > self.max_height:
            # Calculate the ratio of the new height to the old height and resize
            ratio = self.max_height / float(height)
            dimensions = (int(width * ratio), self.max_height)
            self.resizedImage = cv2.resize(self.uploadedImage, dimensions, interpolation = cv2.INTER_AREA)
        
        else: 
            self.resizedImage = self.uploadedImage
        
        dimensions_dict = {"height": self.max_height, "width": int(width * ratio)}
        json_string_dimensions = json.dumps(dimensions_dict)
        
        with open('dimensions.json', 'w') as file:
            file.write(json_string_dimensions)
    
    def content_deletion(self, iterations = 10):
        kernel = np.ones((5, 5), np.uint8)
        self.deleteContent = cv2.morphologyEx(self.resizedImage, cv2.MORPH_CLOSE, kernel, iterations)
        cv2.imshow('deleted', self.deleteContent)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
            
    def color_segmentation(self):
        hsv = cv2.cvtColor(self.deleteContent, cv2.COLOR_BGR2HSV)
        
        lower_white = np.array([0, 0, 140], dtype=np.uint8)
        upper_white = np.array([180, 40, 255], dtype=np.uint8)
        # Threshold the HSV image to get only white colors
        mask = cv2.inRange(hsv, lower_white, upper_white)
        # Bitwise-AND mask and original image
        self.res = cv2.bitwise_and(self.deleteContent, self.deleteContent, mask= mask)
        
        
        cv2.imshow('thresh', self.res)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
    def denoise_image(self, strength = 25):
        gray = cv2.cvtColor(self.res, cv2.COLOR_BGR2GRAY)
        self.denoisedImage = cv2.fastNlMeansDenoising(gray, h = strength)
        cv2.imshow('denoised', self.denoisedImage)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    def delete_background(self):
        _, self.deletedBackground = cv2.threshold(self.denoisedImage, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        cv2.imshow('no-background', self.deletedBackground)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    def detect_edges(self):
        canny = cv2.Canny(self.deletedBackground, 50, 150)
        self.edgesImage = cv2.dilate(canny, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    
    def find_outline(self):
        # Blank canvas.
        con = np.zeros((*self.edgesImage.shape, 3), dtype=np.uint8)  # Notice the 3-channel change here
        # Finding contours for the detected edges.
        contours, hierarchy = cv2.findContours(self.edgesImage, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
        # Keeping only the largest detected contour.
        page = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
        self.outlinedImage = cv2.drawContours(con, page, -1, (0, 255, 255), 3)
        
        for corner in page:
            # Approximate the contour.
            epsilon = 0.02 * cv2.arcLength(corner, True)
            corners = cv2.approxPolyDP(corner, epsilon, True)
            # If our approximated contour has four points
            if len(corners) == 4:
                break
        cv2.drawContours(con, corner, -1, (0, 255, 255), 3)
        cv2.drawContours(con, corners, -1, (0, 255, 0), 10)
        # Sorting the corners and converting them to desired shape.
        corners = sorted(np.concatenate(corners).tolist())
        # Displaying the corners.
        for index, c in enumerate(corners):
             character = chr(65 + index)
             cv2.putText(con, character, tuple(c), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 1, cv2.LINE_AA)
        
        cv2.imshow('outline', self.outlinedImage)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
        ordered_points = self.order_points(corners)
        self.ordered_points = ordered_points
        
        (tl, tr, br, bl) = ordered_points
        # Finding the maximum width.
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        # Finding the maximum height.
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        # Final destination co-ordinates.
        destination_corners = [[0, 0], [maxWidth - 1, 0], [maxWidth - 1, maxHeight - 1], [0, maxHeight - 1]]
        self.destination_corners = destination_corners
    
        return destination_corners

    
    def order_points(self, pts):
        rect = np.zeros((4, 2), dtype= 'float32')
        pts = np.array(pts)
        s = pts.sum(axis = 1)
        # Top-left point will have the smallest sum.
        rect[0] = pts[np.argmin(s)]
        # Bottom-right point will have the largest sum.
        rect[2] = pts[np.argmax(s)]
        
        diff = np.diff(pts, axis=1)
        # Top-right point will have the smallest difference.
        rect[1] = pts[np.argmin(diff)]
        # Bottom-left will have the largest difference.
        rect[3] = pts[np.argmax(diff)]
        # Return the ordered coordinates.
        return rect.astype('int').tolist()

    def document_transform(self):
        # Ensuring that find_outline has been called and has updated ordered_points
        if not hasattr(self, 'ordered_points'):
            self.find_outline()
        # Now we can use self.ordered_points and self.resizedImage

        # Getting the homography.
        M = cv2.getPerspectiveTransform(np.float32(self.ordered_points), np.float32(self.destination_corners))
    
        # Perspective transform using homography.
        self.final = cv2.warpPerspective(self.resizedImage, M, (self.destination_corners[2][0], self.destination_corners[2][1]), flags=cv2.INTER_LINEAR)
        # cv2.imshow('final', self.final)
        # cv2.waitKey(0)
        # cv2.destroyAllWindows()
    
    def scan_image(self):
        image = self.final
        # Sharpen the image
        kernel = np.array([[0, -1, 0],
               [-1, 5,-1],
               [0, -1, 0]])

        sharpened = cv2.filter2D(image, -1, kernel)
        # Apply grayscale effect
        grayScaleImage = cv2.cvtColor(sharpened, cv2.COLOR_BGR2GRAY)
    
        # Define the structuring element
        se = np.ones((1,1), np.uint8)

         # Perform opening
        morphed_img = cv2.morphologyEx(grayScaleImage, cv2.MORPH_OPEN, se)

        # Apply thresholding to mimic the high contrast look of many scanned document
        _, binarized_img = cv2.threshold(morphed_img, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        cv2.imshow('current', morphed_img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
        
fileExplorer = FileExplorer()
edges = DocumentScanner()
edges.receive_image(sys.argv[1]) # load image
coords = edges.get_edge_coordinates() # get the detected document corners
