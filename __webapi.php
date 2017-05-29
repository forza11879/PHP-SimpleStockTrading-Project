<?php
// allows us to skip the first row
$i = 0;
//client sends information to the web server via GET Method.
$symbol = $_GET['symbol'];

$stocks = "https://www.google.com/finance/historical?output=csv&q=" . $symbol;

//reading csv file
$handle = fopen($stocks, 'r'); // fopen — Opens file or URL
//'r'	Open for reading only; place the file pointer at the beginning of the file.
//looping through CSV file
//fgetcsv — Gets line from file pointer and parse for CSV fields
while (($data = fgetcsv($handle, 2000, ",")) !== FALSE) {
//skipp the first row
    if ($i > 0) {//strtotime — Parse about any English textual datetime description into a Unix timestamp
        $data[0] = strtotime($data[0]) * 1000;//function  - strtotime
        $data[1] = floatval($data[1]);//function floatval — Get float value of a variable
        $data[2] = floatval($data[2]);
        $data[3] = floatval($data[3]);
        $data[4] = floatval($data[4]);
        
        //Create an array 
        $chartArray[] = $data;
    }
    $i++;
}
fclose($handle);//fclose — Closes an open file pointer
//Convert PHP Array to reverse JSON String
print (json_encode(array_reverse($chartArray)));//json_encode — Returns the JSON representation of a value
