<?php
$i = 0;

  
    //$stocks = "https://app.quotemedia.com/quotetools/getHistoryDownload.csv?&webmasterId=501&startDay=02&startMonth=03&startYear=2017&endDay=10&endMonth=05&endYear=2017&isRanged=false&symbol=aapl";
        $stocks = "https://www.google.com/finance/historical?output=csv&q=aapl";

//getting data from csv file into database
//reading csv file
    $handle = fopen($stocks, 'r');
    //creating an array
    //$chartArray = array();
//looping through CSV file
   while (($data = fgetcsv($handle, 2000, ",")) !== FALSE) {
        
        if ($i > 0) {
            

            //$data[0] = date('d-m-Y', strtotime($data[0]));
            $data[0] = date('M j, Y', strtotime($data[0]));
            $data[1] = floatval($data[1]);
            $data[2] = floatval($data[2]);
            $data[3] = floatval($data[3]);
            $data[4] = floatval($data[4]);
            //$data[5] = intval($data[5]);
            

         //Create an array 
            $chartArray[] = $data;
            
        }
        $i++;
    }
    
    //print_r($chartArray);
    
    fclose($handle);

    //Convert PHP Array to reverse JSON String
   
    print (json_encode(array_reverse($chartArray)));
    


?>