CREATE TABLE employee (
  employee_id integer primary key NOT NULL,
  first_name varchar(50) NOT NULL,
  surname varchar(50) NOT NULL,
  email varchar(100) NOT NULL,
  pay varchar(6),
  position varchar(50),
  date_registered varchar(10),
  photo_url varchar(100),
  verified boolean NOT NULL,
  token varchar(200),
  office boolean NOT NULL
);

CREATE TABLE employee_office (
  employee_id integer primary key NOT NULL references employee(employee_id),
  password varchar(64) NOT NULL,
  salt varchar(64) NOT NULL,
  access_level integer NOT NULL
);

create table old_users (
	user_id SERIAL PRIMARY KEY,
	first_name VARCHAR (30) NULL,
	surname VARCHAR (30) NULL,
	position VARCHAR (50) NOT NULL,
	date_registered VARCHAR (10) NOT NULL,
	date_removed VARCHAR (10) NOT NULL,
	salary VARCHAR (6) NULL,
	access_level INTEGER NOT NULL
);

create table line (
	line_id SERIAL PRIMARY KEY,
	line_mode VARCHAR (30) NOT NULL,
	number VARCHAR (10) NOT NULL
);

create table material (
	material_id SERIAL PRIMARY KEY,
	line_id SERIAL REFERENCES line(line_id) NOT NULL,
	code VARCHAR (20) NOT NULL,
	name VARCHAR (100) NOT NULL,
	colour CHAR (50) NOT NULL,
	count INTEGER,
	sap_count INTEGER,
	pack_size INTEGER NOT NULL
);

create table completed_request (
	request_id SERIAL PRIMARY KEY,
	line_id SERIAL REFERENCES line(line_id) NOT NULL,
	material_id SERIAL REFERENCES material(material_id) NOT NULL,
	time_requested VARCHAR (50) NOT NULL,
	time_completed VARCHAR (50) NOT NULL
);

create table request (
	request_id SERIAL PRIMARY KEY,
	line_id SERIAL REFERENCES line(line_id) NOT NULL,
	material_id SERIAL REFERENCES material(material_id) NOT NULL,
	status VARCHAR (10) NOT NULL,
	time_requested VARCHAR (50) NOT NULL
);