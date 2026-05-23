-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: honestbee_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `user_account`
--

DROP TABLE IF EXISTS `user_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_account` (
  `USER_id` varchar(120) NOT NULL,
  `USER_firstName` varchar(80) DEFAULT NULL,
  `USER_lastName` varchar(80) DEFAULT NULL,
  `USER_email` varchar(190) NOT NULL,
  `USER_phone` varchar(20) DEFAULT NULL,
  `USER_password` varchar(255) NOT NULL,
  `USER_role` varchar(40) NOT NULL DEFAULT 'customer',
  `USER_linkedId` varchar(120) DEFAULT NULL,
  `USER_status` varchar(40) DEFAULT NULL,
  `USER_city` varchar(80) DEFAULT NULL,
  `USER_preferredDeliveryTime` varchar(60) DEFAULT NULL,
  `USER_createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `USER_updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`USER_id`),
  UNIQUE KEY `USER_email` (`USER_email`),
  KEY `idx_user_city` (`USER_city`),
  CONSTRAINT `fk_user_city` FOREIGN KEY (`USER_city`) REFERENCES `service_city` (`CITY_name`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES ('user-neridm-school-gmail-com','Dec Martin','Neri','neridm.school@gmail.com','09957913852','123','customer','C006',NULL,'Cebu City','','2026-05-07 17:32:41','2026-05-20 07:36:25');
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-20 10:53:13
