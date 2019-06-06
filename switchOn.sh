if [ -f serverOnlineURL.txt ]; then
	mv serverURL.txt serverTestURL.txt
	mv serverOnlineURL.txt serverURL.txt
	mv dbInfo.txt dbTestInfo.txt
        mv dbOnlineInfo.txt dbInfo.txt
else
	mv serverURL.txt serverOnlineURL.txt
        mv serverTestURL.txt serverURL.txt
        mv dbInfo.txt dbOnlineInfo.txt
        mv dbTestInfo.txt dbInfo.txt
fi
