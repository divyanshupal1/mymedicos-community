#!/bin/bash
export PATH=/root/.nvm/versions/node/v20.10.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
echo "Automatic Deployment started...."

echo -e "\nFeching Changes"
git pull

if [ $? -eq 0 ]; then
        echo "successfully fetched changes"
else
        echo "failed fetching changes"
        exit 1
fi

echo -e "\n Building...."
npm i

pm2 restart mymedicos-community-backend

if [ $? -eq 0 ]; then
        echo "deployment success"
else
	echo "starting website.."
        pm2 start npm --name "mymedicos-community-backend" -- start
        if [ $? -eq 0 ]; then
                echo -e "success.."
                exit 1
        else
                echo -e "failed..\n exiting.."
                exit 1
        fi
fi

echo -e "automatic deployment success"
