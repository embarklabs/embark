say "$(cat << 'MSG'

If invoked embark's package.json cannot be parsed then report error and exit

MSG
)"

cd ~/working/embark
echo '}' >> package.json
cd ~/embark_demo
nac lts

bash -i << 'DEMO'
embark version
DEMO

nac default
cd ~/working/embark
git stash &> /dev/null
cd ~
