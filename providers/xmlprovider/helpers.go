package xmlprovider

import (
	"encoding/xml"
	"io"
	"os"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

func UnmarshalFile[T any](filename string, data T) error {
	xmlFile, err := os.Open(filename)
	if err != nil {
		logging.Error(err, "Could not open file: "+filename)
		return err
	}
	defer xmlFile.Close()

	logging.Info("Deserialization: " + filename)
	byteValue, err := io.ReadAll(xmlFile)
	if err != nil {
		logging.Error(err, "Could not read file: "+filename)
		return err
	}
	err = xml.Unmarshal(byteValue, &data)

	if err != nil {
		logging.Error(err, "Could not unmarshal file: "+filename)
		return err
	}
	return nil
}
