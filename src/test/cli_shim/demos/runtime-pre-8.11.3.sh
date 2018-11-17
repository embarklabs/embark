say "$(cat << 'MSG'

If a node < version specified in invoked embark's `{engines:{node:[semver]}}`
is used to run embark then report error and exit

MSG
)"

cd ~/embark_demo
nac pre-8.11.3

bash -i << 'DEMO'
node ~/working/embark/bin/embark version
DEMO

nac default
cd ~
