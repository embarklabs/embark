say "$(cat << 'MSG'

If invoked embark's package.json does not specify a node engine and
node < default minimum version, include a message about the fallback in the
"Unsupported runtime" error messages

MSG
)"

cd ~/working/embark
nac lts
json -I -f package.json -e 'delete this.engines.node' &> /dev/null

cd ~/embark_demo
nac pre-8.11.3

bash -i << 'DEMO'
node ~/working/embark/bin/embark version
DEMO

say "$(cat << 'MSG'

No message about the fallback to testing with the default minimum version is
displayed if the node version is supported

MSG
)"

nac lts

bash -i << 'DEMO'
node ~/working/embark/bin/embark version
DEMO

nac default
cd ~/working/embark
git stash &> /dev/null
cd ~
