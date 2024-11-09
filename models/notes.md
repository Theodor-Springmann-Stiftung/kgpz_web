# Notes on xml reading

The models expect certain files and a certain file XML structure and throw quite often if the structure is not as expected.
This is by design, as the models are supposed to be used in a controlled environment. Changes in the XML schema should be reflected in the models.
All collections in the models should be kept thread-safe. 
