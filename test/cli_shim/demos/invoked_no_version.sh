say "$(cat << 'MSG'

If invoked embark's package.json does not specify a version then report warning
and continue

MSG
)"

cd ~/working/embark
nac lts
json -I -f package.json -e 'delete this.version' &> /dev/null
cd ~/embark_demo

bash -i << 'DEMO'
embark version
DEMO

nac default
cd ~/working/embark
git stash &> /dev/null
cd ~
