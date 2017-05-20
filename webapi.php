<?php
$i = 0;

    $stocks = "https://www.google.com/finance/historical?output=csv&q=aapl";

//getting data from csv file into database
//reading csv file
    $handle = fopen($stocks, 'r');
    //creating an array
    $chartArray = array();
//looping through CSV file
    while (($data = fgetcsv($handle, 2000, ",")) !== FALSE) {
        if ($i > 0) {

            $chartArray[] = $data;
        }
        $i++;
    }

    fclose($handle);


    print (json_encode($chartArray));
    


?>