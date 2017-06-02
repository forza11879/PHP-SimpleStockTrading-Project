-- phpMyAdmin SQL Dump
-- version 4.6.6
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 29, 2017 at 10:37 AM
-- Server version: 5.6.35
-- PHP Version: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cp4776_tradingapp`
--

-- --------------------------------------------------------

--
-- Table structure for table `portfolios`
--

CREATE TABLE `portfolios` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `symbol` varchar(10) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `avgprice` decimal(10,2) DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `portfolios`
--

INSERT INTO `portfolios` (`id`, `userId`, `symbol`, `qty`, `avgprice`, `date`) VALUES
(1, 1, 'FAS', 5, '0.00', NULL),
(3, 1, 'F', 12, '10.88', NULL),
(5, 1, 'EBAY', 80, '33.83', NULL),
(6, 1, 'TSLA', 5, '100.00', NULL),
(7, 1, 'GOOG', 1, '100.00', NULL),
(9, 2, 'ADSK', 1, '113.01', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `symbols`
--

CREATE TABLE `symbols` (
  `id` int(11) NOT NULL,
  `symbol` varchar(8) NOT NULL,
  `name` varchar(100) NOT NULL,
  `bid` decimal(10,2) NOT NULL,
  `ask` decimal(10,2) NOT NULL,
  `open` decimal(10,2) NOT NULL,
  `previousClose` decimal(10,2) NOT NULL,
  `lastTrade` decimal(10,2) NOT NULL,
  `high` decimal(10,2) NOT NULL,
  `low` decimal(10,2) NOT NULL,
  `volume` int(11) NOT NULL,
  `high52` decimal(10,2) NOT NULL,
  `low52` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `symbols`
--

INSERT INTO `symbols` (`id`, `symbol`, `name`, `bid`, `ask`, `open`, `previousClose`, `lastTrade`, `high`, `low`, `volume`, `high52`, `low52`) VALUES
(1, 'AAPL', 'Apple Inc.', '153.30', '153.50', '154.00', '153.87', '153.61', '154.24', '153.31', 21927637, '156.65', '91.50'),
(5, 'TSLA', 'Tesla, Inc.', '325.33', '325.93', '317.28', '316.83', '325.14', '325.49', '316.31', 7802199, '327.66', '178.19'),
(7, 'F', 'Ford Motor Company', '0.00', '0.00', '10.85', '10.86', '10.93', '10.94', '10.81', 28176454, '14.04', '10.67'),
(8, 'EBAY', 'eBay Inc.', '34.72', '35.08', '35.26', '35.22', '34.90', '35.26', '34.66', 6622496, '35.30', '22.30'),
(9, 'JPM', 'JP Morgan Chase & Co. Common St', '0.00', '0.00', '85.99', '85.71', '85.35', '86.08', '85.08', 12238543, '93.98', '57.05'),
(19, 'GOOG', 'Alphabet Inc.', '963.20', '971.39', '969.70', '969.54', '971.47', '974.98', '965.03', 1252010, '974.98', '663.28'),
(20, 'FAS', 'Direxion Financial Bull 3X Shar', '0.00', '0.00', '44.53', '44.86', '44.70', '44.93', '44.30', 1120326, '51.11', '21.14'),
(219, 'XLF', 'SPDR Select Sector Fund - Finan', '0.00', '0.00', '23.56', '23.62', '23.61', '23.68', '23.56', 42601706, '25.30', '17.32'),
(220, 'ADSK', 'Autodesk, Inc.', '110.50', '113.01', '114.24', '113.89', '113.03', '114.42', '112.87', 2109782, '114.68', '49.82'),
(221, 'QQQ', 'PowerShares QQQ Trust, Series 1', '141.30', '141.33', '141.00', '140.97', '141.22', '141.28', '140.81', 13851582, '141.33', '101.75'),
(1153, 'WFC', 'Wells Fargo & Company', '0.00', '0.00', '52.63', '52.78', '52.41', '52.81', '52.37', 14247740, '59.99', '43.55'),
(1155, 'GE', 'General Electric Company', '0.00', '0.00', '27.46', '27.49', '27.45', '27.55', '27.29', 30624045, '33.00', '27.10');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `qty` int(11) NOT NULL,
  `type` varchar(10) NOT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `userId`, `symbol`, `price`, `qty`, `type`, `date`) VALUES
(1, 1, 'EBAY', '34.00', 15, 'buy', '0000-00-00 00:00:00'),
(2, 1, 'EBAY', '33.83', 5, 'buy', '0000-00-00 00:00:00'),
(3, 1, 'EBAY', '33.83', 5, 'bought', '2017-05-21 00:00:00'),
(4, 1, 'EBAY', '33.83', 10, 'bought', '2017-05-21 00:00:00'),
(5, 1, 'EBAY', '33.83', 5, 'bought', '2017-05-21 00:00:00'),
(6, 2, 'GOOG', '971.39', 1, 'buy', '2017-05-29 10:43:56'),
(7, 2, 'GOOG', '963.20', 1, 'sell', '2017-05-29 10:44:17'),
(8, 2, 'ADSK', '113.01', 1, 'buy', '2017-05-29 12:14:03');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(250) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(50) NOT NULL,
  `cash` decimal(10,2) NOT NULL DEFAULT '50000.00',
  `equity` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password`, `cash`, `equity`) VALUES
(1, 'grish@gmail.com', 'grisha', 'gG560526', '49831.00', '55198.45'),
(2, 'Forza11879@gmail.com', 'Forza', 'Forzaforza77', '49878.80', '49989.30'),
(3, 'ipd9@gmail.com', 'ipd9', 'gG560526', '50000.00', '50000.00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `portfolios`
--
ALTER TABLE `portfolios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`,`symbol`),
  ADD KEY `symbol` (`symbol`),
  ADD KEY `userId_2` (`userId`);

--
-- Indexes for table `symbols`
--
ALTER TABLE `symbols`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `symbol` (`symbol`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `symbol` (`symbol`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `portfolios`
--
ALTER TABLE `portfolios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT for table `symbols`
--
ALTER TABLE `symbols`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1159;
--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `portfolios`
--
ALTER TABLE `portfolios`
  ADD CONSTRAINT `portfolios_ibfk_1` FOREIGN KEY (`symbol`) REFERENCES `symbols` (`symbol`),
  ADD CONSTRAINT `portfolios_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`symbol`) REFERENCES `symbols` (`symbol`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
